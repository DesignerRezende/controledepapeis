// --- Variáveis Globais ---
let estoquePapeis = []; // Armazenará os dados do CSV
let historicoUso = []; // Armazenará o histórico de baixas
const CSV_FILE_PATH = 'Controle_de_Papeis.csv'; // Caminho do seu CSV

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const formBaixa = document.getElementById('form-baixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');
const listaEstoqueBaixo = document.getElementById('lista-estoque-baixo');
const listaPapeisUsados = document.getElementById('lista-papeis-usados');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');


// --- Funções Principais ---

/**
 * Define o estoque mínimo com base na quantidade de folhas por pacote.
 * @param {number | string} folhasPorPacote - A quantidade de folhas no pacote.
 * @returns {number} O estoque mínimo de folhas.
 */
function getEstoqueMinimo(folhasPorPacote) {
    const folhas = parseInt(folhasPorPacote, 10);
    if (folhas === 100) return 40;
    if (folhas === 50) return 30;
    if (folhas === 20) return 10;
    if (folhas === 10) return 5;
    return 0; // Retorna 0 como padrão se não houver regra
}

/**
 * Carrega e processa os dados de um arquivo CSV.
 * @param {string} url - O caminho para o arquivo CSV.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve com os dados processados.
 */
async function parseCSV(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].trim().split(';');

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue; // Pula linhas vazias
            const values = lines[i].trim().split(';');
            if (values.length === headers.length) {
                const obj = {};
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = values[j];
                }
                // *** APLICA A NOVA REGRA DE ESTOQUE MÍNIMO ***
                obj['Estoque Mínimo'] = getEstoqueMinimo(obj['Folhas por Pacote']);
                data.push(obj);
            }
        }
        return data;
    } catch (error) {
        console.error("Falha ao carregar ou processar o CSV:", error);
        throw error; // Propaga o erro para ser tratado mais tarde
    }
}

/**
 * Renderiza a tabela de estoque na página.
 */
function renderizarTabela() {
    tabelaEstoque.innerHTML = ''; // Limpa a tabela antes de renderizar
    if (estoquePapeis.length === 0) {
        tabelaEstoque.innerHTML = '<tr><td colspan="6">Nenhum dado de estoque encontrado.</td></tr>';
        return;
    }
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');
        // Define um ID único para a linha para facilitar a atualização
        row.id = `item-${item['Tipo de Papel'].replace(/\s+/g, '-')}-${item['Tamanho']}`;
        row.innerHTML = `
            <td>${item['Tipo de Papel']}</td>
            <td>${item['Tamanho']}</td>
            <td>${item['Quantidade de Pacotes']}</td>
            <td>${item['Folhas por Pacote']}</td>
            <td>${item['Total de Folhas']}</td>
            <td>${item['Estoque Mínimo']}</td>
        `;
        tabelaEstoque.appendChild(row);
    });
}

/**
 * Renderiza o alerta de estoque baixo.
 */
function renderizarAlertaEstoqueBaixo() {
    listaEstoqueBaixo.innerHTML = '';
    const itensBaixos = estoquePapeis.filter(
        item => parseInt(item['Total de Folhas']) <= parseInt(item['Estoque Mínimo'])
    );

    if (itensBaixos.length === 0) {
        listaEstoqueBaixo.innerHTML = '<li>Nenhum item com estoque baixo.</li>';
    } else {
        itensBaixos.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `Atenção: ${item['Tipo de Papel']} (${item['Tamanho']}) está com apenas ${item['Total de Folhas']} folhas.`;
            listaEstoqueBaixo.appendChild(li);
        });
    }
}

/**
 * Popula o menu dropdown para dar baixa.
 */
function popularSelectBaixa() {
    tipoPapelBaixaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    estoquePapeis.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = index; // Usa o índice do array como valor
        option.textContent = `${item['Tipo de Papel']} - ${item['Tamanho']}`;
        tipoPapelBaixaSelect.appendChild(option);
    });
}

/**
 * Gera e dispara o download de um arquivo CSV com o estado atual do estoque.
 */
function gerarCsvParaDownload() {
    if (estoquePapeis.length === 0) {
        alert("Não há dados de estoque para baixar.");
        return;
    }
    
    // Usa os cabeçalhos do primeiro item como referência
    const headers = Object.keys(estoquePapeis[0]);
    let csvContent = headers.join(";") + "\r\n"; // Adiciona cabeçalho

    estoquePapeis.forEach(item => {
        const row = headers.map(header => {
            let value = item[header];
            // Se o valor contiver o delimitador, coloca entre aspas
            if (typeof value === 'string' && value.includes(';')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += row.join(";") + "\r\n";
    });
    
    // Cria um "Blob" que é um objeto de arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "estoque_atualizado.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Funções de Persistência (LocalStorage) ---

function salvarDadosNoLocalStorage() {
    localStorage.setItem('estoquePapeis', JSON.stringify(estoquePapeis));
    localStorage.setItem('historicoUso', JSON.stringify(historicoUso));
}

function carregarDadosDoLocalStorage() {
    const estoqueSalvo = localStorage.getItem('estoquePapeis');
    const historicoSalvo = localStorage.getItem('historicoUso');
    if (estoqueSalvo) {
        estoquePapeis = JSON.parse(estoqueSalvo);
    }
    if (historicoSalvo) {
        historicoUso = JSON.parse(historicoSalvo);
    }
}

// --- Eventos ---

// Evento de envio do formulário de baixa
formBaixa.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemIndex = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value, 10);
    const finalidade = document.getElementById('finalidadeBaixa').value;

    if (itemIndex === "" || !quantidade || !finalidade) {
        mensagemBaixa.textContent = 'Por favor, preencha todos os campos.';
        mensagemBaixa.className = 'error';
        return;
    }

    const item = estoquePapeis[itemIndex];
    if (quantidade > parseInt(item['Total de Folhas'])) {
        mensagemBaixa.textContent = `Erro: Quantidade insuficiente em estoque (${item['Total de Folhas']} folhas).`;
        mensagemBaixa.className = 'error';
        return;
    }

    // Atualiza o estoque
    item['Total de Folhas'] = parseInt(item['Total de Folhas']) - quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);

    // Adiciona ao histórico
    historicoUso.push({
        tipo: item['Tipo de Papel'],
        tamanho: item['Tamanho'],
        quantidade: quantidade,
        finalidade: finalidade,
        data: new Date().toLocaleString('pt-BR')
    });

    // Salva e atualiza a interface
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
    //renderizarPapeisMaisUsados(); // Descomente se tiver essa função

    mensagemBaixa.textContent = `Baixa de ${quantidade} folhas de ${item['Tipo de Papel']} registrada com sucesso!`;
    mensagemBaixa.className = 'success';
    formBaixa.reset();
});

// Evento para o botão de download CSV
downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    carregarDadosDoLocalStorage();

    if (estoquePapeis.length === 0) {
        try {
            estoquePapeis = await parseCSV(CSV_FILE_PATH);
            salvarDadosNoLocalStorage();
        } catch (error) {
            tabelaEstoque.innerHTML = '<tr><td colspan="6">Erro ao carregar dados. Verifique o console para mais detalhes.</td></tr>';
            return;
        }
    }

    // Renderização inicial
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
    popularSelectBaixa();
    //renderizarPapeisMaisUsados(); // Descomente se tiver essa função
});