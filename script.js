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

// Função para parsear CSV (assume ; como delimitador)
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
            const headerName = headers[j].trim(); // Pega o nome da coluna sem espaços extras
            
            // Tenta converter para número as colunas que devem ser numéricas
            if (['Quantidade de Pacotes', 'Folhas por Pacote', 'Total de Folhas', 'Estoque Mínimo'].includes(headerName)) {
                // Remove qualquer caractere não numérico, como '<'
                const cleanedValue = value.replace(/[^0-9.-]+/g, ''); 
                row[headerName] = parseFloat(cleanedValue) || 0; // Se não for um número válido, assume 0
            } else {
                row[headerName] = value.trim();
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
    // Ordem das colunas para o CSV de download (DEVE BATER EXATAMENTE COM OS NOMES NO SEU CSV ORIGINAL)
    const columnOrder = ['Tipo de Papel', 'Tamanho', 'Quantidade de Pacotes', 'Folhas por Pacote', 'Total de Folhas', 'Estoque Mínimo']; 
    const headers = columnOrder.join(';'); 
    
    const rows = estoquePapeis.map(item => {
        // Mapeia os valores na ordem correta das colunas
        return columnOrder.map(col => {
            // Garante que o valor não seja undefined e converte para string
            // Para 'Total de Folhas', se for abaixo do 'Folhas por Pacote' na regra antiga, 
            // podemos adicionar o '<' novamente na exportação se você quiser.
            // Por enquanto, vamos exportar apenas o número.
            let value = item[col] !== undefined ? String(item[col]) : '';
            return value;
        }).join(';');
    });
    
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
        tabelaEstoque.innerHTML = '<tr><td colspan="6">Nenhum papel em estoque.</td></tr>'; // 6 colunas
        return;
    }

    estoquePapeis.forEach(item => {
        const row = tabelaEstoque.insertRow();
        // Acessa as colunas EXATAMENTE como estão no CSV
        row.insertCell().textContent = item['Tipo de Papel'];
        row.insertCell().textContent = item['Tamanho'];
        row.insertCell().textContent = item['Quantidade de Pacotes']; // Corrigido
        row.insertCell().textContent = item['Folhas por Pacote'];     // Corrigido
        row.insertCell().textContent = item['Total de Folhas'];
        // Se 'Estoque Mínimo' existir no seu CSV, exiba. Se não, ficará N/A.
        row.insertCell().textContent = item['Estoque Mínimo'] !== undefined ? item['Estoque Mínimo'] : 'N/A'; 
        
        // Adiciona opções para o select de baixa usando o "Tipo de Papel" completo
        const option = document.createElement('option');
        option.value = item['Tipo de Papel']; 
        option.textContent = `${item['Tipo de Papel']} (${item['Tamanho']})`;
        tipoPapelBaixaSelect.appendChild(option);
    });
}

// Verifica e exibe itens com estoque baixo
function renderizarEstoqueBaixo() {
    listaEstoqueBaixo.innerHTML = '';
    const itensBaixo = estoquePapeis.filter(item => 
        // Lógica: Total de Folhas < Folhas por Pacote
        // Garante que ambos são números antes de comparar
        parseFloat(item['Total de Folhas']) < parseFloat(item['Folhas por Pacote']) 
    );

    if (itensBaixo.length === 0) {
        listaEstoqueBaixo.innerHTML = '<li>Nenhum papel com estoque baixo.</li>';
        return;
    }

    itensBaixo.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item['Tipo de Papel']} (${item['Tamanho']}): ${item['Total de Folhas']} folhas em estoque (Mínimo para próximo pacote: ${item['Folhas por Pacote']} folhas).`;
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

    // Calcula o total de uso por papel (combinando Tipo de Papel e Tamanho para clareza)
    const usoPorPapel = {};
    historicoUso.forEach(registro => {
        const chavePapel = `${registro.tipoPapelUsado} (${registro.tamanhoPapelUsado})`; 
        const quantidade = registro.quantidade;
        usoPorPapel[chavePapel] = (usoPorPapel[chavePapel] || 0) + quantidade;
    });

    // Converte para array e ordena
    const papeisOrdenados = Object.entries(usoPorPapel).sort((a, b) => b[1] - a[1]);

    papeisOrdenados.forEach(([chavePapel, totalUsado]) => {
        const li = document.createElement('li');
        li.textContent = `${chavePapel}: ${totalUsado} folhas usadas.`;
        listaPapeisUsados.appendChild(li);
    });
}

// --- Event Listeners ---

// Lidar com o formulário de baixa
formBaixa.addEventListener('submit', (event) => {
    event.preventDefault(); // Evita que a página recarregue

    const tipoCompletoPapelSelecionado = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value);
    const finalidade = document.getElementById('finalidadeBaixa').value.trim();

    if (!tipoCompletoPapelSelecionado || !quantidade || !finalidade) {
        mensagemBaixa.textContent = 'Por favor, preencha todos os campos.';
        mensagemBaixa.className = 'error';
        return;
    }

    // Encontra o item baseado no "Tipo de Papel" completo (que é o value do select)
    const item = estoquePapeis.find(p => p['Tipo de Papel'] === tipoCompletoPapelSelecionado); 

    if (item) {
        if (item['Total de Folhas'] >= quantidade) { // Usa a coluna correta 'Total de Folhas'
            item['Total de Folhas'] -= quantidade; // Atualiza a coluna correta

            historicoUso.push({
                data: new Date().toLocaleString(),
                tipoPapelUsado: item['Tipo de Papel'], // Salva o tipo completo
                tamanhoPapelUsado: item['Tamanho'], // Salva o tamanho
                quantidade: quantidade,
                finalidade: finalidade
            });

            mensagemBaixa.textContent = `Baixa de ${quantidade} folhas de ${item['Tipo de Papel']} (${item['Tamanho']}) registrada para: ${finalidade}.`;
            mensagemBaixa.className = ''; // Remove a classe de erro se houver
            formBaixa.reset(); // Limpa o formulário

            // Atualiza todas as seções
            salvarDadosNoLocalStorage(); // Salva as alterações
            renderizarEstoque();
            renderizarEstoqueBaixo();
            renderizarPapeisMaisUsados();
        } else {
            mensagemBaixa.textContent = `Erro: Quantidade insuficiente de ${item['Tipo de Papel']} (${item['Tamanho']}) em estoque (${item['Total de Folhas']} folhas).`;
            mensagemBaixa.className = 'error';
        }
    } else {
        mensagemBaixa.textContent = 'Erro: Papel não encontrado com o Tipo de Papel selecionado.';
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
            tabelaEstoque.innerHTML = '<tr><td colspan="6">Erro ao carregar os dados do estoque. Certifique-se de que o CSV existe e está formatado corretamente.</td></tr>'; // 6 colunas
            return;
        }
    }
    
    // Renderiza a interface inicial
    renderizarEstoque();
    renderizarEstoqueBaixo();
    renderizarPapeisMaisUsados();
});