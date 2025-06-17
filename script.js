// --- Variáveis Globais ---
let estoquePapeis = [];
const CSV_FILE_PATH = 'Controle_de_Papeis.csv';

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const listaEstoqueBaixo = document.getElementById('lista-estoque-baixo');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

// Elementos do Modal Unificado
const baixaModal = document.getElementById('baixa-modal');
const openBaixaModalBtn = document.getElementById('open-baixa-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Elementos da View de Login
const loginView = document.getElementById('login-view');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

// Elementos da View de Formulário de Baixa
const formBaixaView = document.getElementById('form-baixa-view');
const formBaixa = document.getElementById('form-baixa');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');


// --- Funções Principais ---

/**
 * Define o estoque mínimo com base na quantidade de folhas por pacote.
 * @param {number | string} folhasPorPacote A quantidade de folhas no pacote.
 * @returns {number} O estoque mínimo de folhas.
 */
function getEstoqueMinimo(folhasPorPacote) {
    const folhas = parseInt(folhasPorPacote, 10);
    if (folhas === 100) return 40;
    if (folhas === 50) return 20;
    if (folhas === 20) return 8;
    if (folhas === 10) return 4;
    return 0;
}

/**
 * [NOVO] Garante que as regras de estoque mínimo sejam aplicadas a todos os itens.
 * Esta função corrige o bug de dados antigos no localStorage.
 * @param {Array<Object>} dados O array de estoque de papéis.
 * @returns {Array<Object>} Os dados com as regras atualizadas.
 */
function aplicarRegrasDeEstoque(dados) {
    return dados.map(item => {
        item['Estoque Mínimo'] = getEstoqueMinimo(item['Folhas por Pacote']);
        return item;
    });
}

/**
 * Carrega e processa os dados de um arquivo CSV.
 * @param {string} url O caminho para o arquivo CSV.
 */
async function parseCSV(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].trim().split(';');
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const values = lines[i].trim().split(';');
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => obj[header] = values[index]);
                data.push(obj);
            }
        }
        return data;
    } catch (error) {
        console.error("Falha ao carregar ou processar o CSV:", error);
        throw error;
    }
}

/**
 * Renderiza a tabela de estoque na página.
 * A coluna de estoque mínimo foi totalmente removida daqui.
 */
function renderizarTabela() {
    tabelaEstoque.innerHTML = '';
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item['Tipo de Papel']}</td>
            <td>${item['Tamanho']}</td>
            <td>${item['Quantidade de Pacotes']}</td>
            <td>${item['Folhas por Pacote']}</td>
            <td>${item['Total de Folhas']}</td>
        `;
        tabelaEstoque.appendChild(row);
    });
}

/**
 * Renderiza o alerta de estoque baixo na página.
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
            li.textContent = `Atenção: ${item['Tipo de Papel']} (${item['Tamanho']}) está com apenas ${item['Total de Folhas']} folhas. (Mínimo: ${item['Estoque Mínimo']})`;
            listaEstoqueBaixo.appendChild(li);
        });
    }
}

/**
 * Popula o menu <select> dentro do formulário de baixa.
 */
function popularSelectBaixa() {
    tipoPapelBaixaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    estoquePapeis.forEach((item, index) => {
        const option = new Option(`${item['Tipo de Papel']} - ${item['Tamanho']}`, index);
        tipoPapelBaixaSelect.add(option);
    });
}


// --- Funções de Login e Fluxo do Modal ---

function mostrarViewLogin() {
    formBaixaView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginError.textContent = '';
    passwordInput.value = '';
}

function mostrarViewFormBaixa() {
    loginView.classList.add('hidden');
    formBaixaView.classList.remove('hidden');
    mensagemBaixa.textContent = '';
    popularSelectBaixa(); // Popula o select sempre que o form é exibido
}

function handleLogin(e) {
    e.preventDefault();
    const correctPassword = "1cafez!n";
    if (passwordInput.value === correctPassword) {
        sessionStorage.setItem('loggedIn', 'true');
        mostrarViewFormBaixa();
    } else {
        loginError.textContent = 'Senha incorreta. Tente novamente.';
        passwordInput.focus();
    }
}

// --- Funções de Persistência e Download ---

function salvarDadosNoLocalStorage() {
    localStorage.setItem('estoquePapeis', JSON.stringify(estoquePapeis));
}

function carregarDadosDoLocalStorage() {
    const estoqueSalvo = localStorage.getItem('estoquePapeis');
    return estoqueSalvo ? JSON.parse(estoqueSalvo) : null;
}

function gerarCsvParaDownload() {
    // Implementação da função de download permanece a mesma
    const headers = Object.keys(estoquePapeis[0]);
    let csvContent = headers.join(";") + "\r\n";
    estoquePapeis.forEach(item => {
        const row = headers.map(h => `"${item[h]}"`).join(";");
        csvContent += row + "\r\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "estoque_atualizado.csv";
    link.click();
}

// --- Eventos ---

openBaixaModalBtn.addEventListener('click', () => {
    baixaModal.classList.remove('hidden');
    if (sessionStorage.getItem('loggedIn') === 'true') {
        mostrarViewFormBaixa();
    } else {
        mostrarViewLogin();
    }
});

closeModalBtn.addEventListener('click', () => baixaModal.classList.add('hidden'));
loginForm.addEventListener('submit', handleLogin);
downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);

formBaixa.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemIndex = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value, 10);

    const item = estoquePapeis[itemIndex];
    if (quantidade > parseInt(item['Total de Folhas'])) {
        mensagemBaixa.textContent = `Erro: Quantidade insuficiente em estoque.`;
        mensagemBaixa.className = 'error';
        return;
    }

    item['Total de Folhas'] = parseInt(item['Total de Folhas']) - quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);
    
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();

    mensagemBaixa.textContent = 'Baixa registrada com sucesso!';
    mensagemBaixa.className = 'success';
    formBaixa.reset();
    popularSelectBaixa(); // Repopula para refletir o estado inicial
});


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    let dadosCarregados = carregarDadosDoLocalStorage();

    if (!dadosCarregados) {
        try {
            dadosCarregados = await parseCSV(CSV_FILE_PATH);
        } catch (error) {
            tabelaEstoque.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
            return;
        }
    }

    // APLICA AS REGRAS AQUI! Esta é a correção crucial do bug.
    estoquePapeis = aplicarRegrasDeEstoque(dadosCarregados);
    
    salvarDadosNoLocalStorage(); // Salva os dados com as regras corretas
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
});
