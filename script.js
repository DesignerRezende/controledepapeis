// --- Variáveis Globais ---
let estoquePapeis = []; // Armazenará os dados do CSV
let historicoUso = []; // Armazenará o histórico de baixas
const CSV_FILE_PATH = 'Controle_de_Papeis.csv'; // Caminho do seu CSV no GitHub

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const formBaixa = document.getElementById('form-baixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');
const listaEstoqueBaixo = document.getElementById('lista-estoque-baixo');
const listaPapeisUsados = document.getElementById('lista-papeis-usados');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');


// --- Funções Auxiliares ---

// Função para parsear CSV (simples, assume ; como delimitador)
async function parseCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    
    // Divide o texto em linhas e remove linhas vazias
    const lines = text.trim().split('\n');
    
    // Extrai o cabeçalho (primeira linha)
    const headers = lines[0].split(';');
    
    const data = [];
    // Itera sobre as linhas de dados (a partir da segunda linha)
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            let value = values[j];
            // Tenta converter para número se possível
            if (!isNaN(value) && value.trim() !== '') {
                row[headers[j].trim()] = parseFloat(value);
            } else {
                row[headers[j].trim()] = value.trim();
            }
        }
        data.push(row);
    }
    return data;
}

// Salva o estoque e histórico no localStorage
function salvarDadosNoLocalStorage() {
    localStorage.setItem('estoquePapeis', JSON.stringify(estoquePapeis));
    localStorage.setItem('historicoUso', JSON.stringify(historicoUso));
}

// Carrega o estoque e histórico do localStorage
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

// Gera um CSV a partir dos dados do estoque atualizado
function gerarCsvParaDownload() {
    const headers = Object.keys(estoquePapeis[0]).join(';'); // Assume que todos os objetos têm as mesmas chaves
    const rows = estoquePapeis.map(item => Object.values(item).join(';'));
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + '\n' + rows.join('\n'));
    
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'Controle_de_Papeis_Atualizado.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Arquivo 'Controle_de_Papeis_Atualizado.csv' gerado! Lembre-se de fazer upload dele para o seu repositório GitHub para persistir as mudanças.");
}


// --- Funções de Renderização e Lógica ---

// Renderiza a tabela de estoque na tela
function renderizarEstoque() {
    tabelaEstoque.innerHTML = ''; // Limpa a tabela
    tipoPapelBaixaSelect.innerHTML = '<option value="">Selecione um papel</option>'; // Limpa e adiciona opção padrão
    
    if (estoquePapeis.length === 0) {
        tabelaEstoque.innerHTML = '<tr><td colspan="3">Nenhum papel em estoque.</td></tr>';
        return;
    }

    estoquePapeis.forEach(item => {
        const row = tabelaEstoque.insertRow();
        row.insertCell().textContent = item['Tipo de Papel']; // Adapte aos nomes das colunas do seu CSV
        row.insertCell().textContent = item['Quantidade']; // Adapte aos nomes das colunas do seu CSV
        row.insertCell().textContent = item['Aviso Minimo'] || 'N/A'; // Adapte aos nomes das colunas do seu CSV
        
        // Adiciona opções para o select de baixa
        const option = document.createElement('option');
        option.value = item['Tipo de Papel'];
        option.textContent = item['Tipo de Papel'];
        tipoPapelBaixaSelect.appendChild(option);
    });
}

// Verifica e exibe itens com estoque baixo
function renderizarEstoqueBaixo() {
    listaEstoqueBaixo.innerHTML = '';
    const itensBaixo = estoquePapeis.filter(item => 
        item['Quantidade'] <= (item['Aviso Minimo'] || 0) // Considera 0 se Aviso Minimo não existir
    );

    if (itensBaixo.length === 0) {
        listaEstoqueBaixo.innerHTML = '<li>Nenhum papel com estoque baixo.</li>';
        return;
    }

    itensBaixo.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item['Tipo de Papel']}: ${item['Quantidade']} (Aviso Mínimo: ${item['Aviso Minimo'] || 'N/A'})`;
        listaEstoqueBaixo.appendChild(li);
    });
}

// Renderiza o relatório de papéis mais usados
function renderizarPapeisMaisUsados() {
    listaPapeisUsados.innerHTML = '';
    if (historicoUso.length === 0) {
        listaPapeisUsados.innerHTML = '<li>Nenhum registro de uso ainda.</li>';
        return;
    }

    // Calcula o total de uso por tipo de papel
    const usoPorTipo = {};
    historicoUso.forEach(registro => {
        const tipo = registro.tipoPapel;
        const quantidade = registro.quantidade;
        usoPorTipo[tipo] = (usoPorTipo[tipo] || 0) + quantidade;
    });

    // Converte para array e ordena
    const papeisOrdenados = Object.entries(usoPorTipo).sort((a, b) => b[1] - a[1]);

    papeisOrdenados.forEach(([tipo, totalUsado]) => {
        const li = document.createElement('li');
        li.textContent = `${tipo}: ${totalUsado} unidades usadas.`;
        listaPapeisUsados.appendChild(li);
    });
}

// --- Event Listeners ---

// Lidar com o formulário de baixa
formBaixa.addEventListener('submit', (event) => {
    event.preventDefault(); // Evita que a página recarregue

    const tipo = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value);
    const finalidade = document.getElementById('finalidadeBaixa').value.trim();

    if (!tipo || !quantidade || !finalidade) {
        mensagemBaixa.textContent = 'Por favor, preencha todos os campos.';
        mensagemBaixa.className = 'error';
        return;
    }

    const item = estoquePapeis.find(p => p['Tipo de Papel'] === tipo);

    if (item) {
        if (item['Quantidade'] >= quantidade) {
            item['Quantidade'] -= quantidade;
            historicoUso.push({
                data: new Date().toLocaleString(),
                tipoPapel: tipo,
                quantidade: quantidade,
                finalidade: finalidade
            });

            mensagemBaixa.textContent = `Baixa de ${quantidade} de ${tipo} registrada para: ${finalidade}.`;
            mensagemBaixa.className = ''; // Remove a classe de erro se houver
            formBaixa.reset(); // Limpa o formulário

            // Atualiza todas as seções
            salvarDadosNoLocalStorage(); // Salva as alterações
            renderizarEstoque();
            renderizarEstoqueBaixo();
            renderizarPapeisMaisUsados();
        } else {
            mensagemBaixa.textContent = `Erro: Quantidade insuficiente de ${tipo} em estoque (${item['Quantidade']}).`;
            mensagemBaixa.className = 'error';
        }
    } else {
        mensagemBaixa.textContent = 'Erro: Tipo de papel não encontrado.';
        mensagemBaixa.className = 'error';
    }
});

// Evento para o botão de download CSV
downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    // Tenta carregar do localStorage primeiro
    carregarDadosDoLocalStorage();

    // Se o localStorage estiver vazio (primeira vez ou limpo), carrega do CSV
    if (estoquePapeis.length === 0) {
        try {
            estoquePapeis = await parseCSV(CSV_FILE_PATH);
            // Salva a versão inicial do CSV no localStorage
            salvarDadosNoLocalStorage(); 
        } catch (error) {
            console.error('Erro ao carregar o CSV:', error);
            tabelaEstoque.innerHTML = '<tr><td colspan="3">Erro ao carregar os dados do estoque.</td></tr>';
            return;
        }
    }
    
    // Renderiza a interface inicial
    renderizarEstoque();
    renderizarEstoqueBaixo();
    renderizarPapeisMaisUsados();
});