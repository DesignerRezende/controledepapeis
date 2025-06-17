// --- Variáveis Globais ---
let estoquePapeis = [];
let acaoAtual = ''; // Guarda a ação do usuário ('entrada' ou 'baixa')
const CSV_FILE_PATH = 'Controle_de_Papeis.csv';

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const estoqueModal = document.getElementById('estoque-modal');
const openEntradaModalBtn = document.getElementById('open-entrada-modal-btn');
const openBaixaModalBtn = document.getElementById('open-baixa-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
// Views do Modal
const loginView = document.getElementById('login-view');
const formBaixaView = document.getElementById('form-baixa-view');
const formEntradaView = document.getElementById('form-entrada-view');
// Formulários
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const formBaixa = document.getElementById('form-baixa');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');
const formEntrada = document.getElementById('form-entrada');
const tipoPapelEntradaSelect = document.getElementById('tipoPapelEntrada');
const mensagemEntrada = document.getElementById('mensagem-entrada');

// --- Funções Principais ---

function getEstoqueMinimo(folhasPorPacote) {
    const folhas = parseInt(folhasPorPacote, 10);
    if (folhas === 100) return 40;
    if (folhas === 50) return 20;
    if (folhas === 20) return 8;
    if (folhas === 10) return 4;
    return 0;
}

function aplicarRegrasDeEstoque(dados) {
    return dados.map(item => {
        item['Estoque Mínimo'] = getEstoqueMinimo(item['Folhas por Pacote']);
        return item;
    });
}

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
        throw error;
    }
}

function renderizarTabela() {
    tabelaEstoque.innerHTML = '';
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');
        if (parseInt(item['Total de Folhas']) <= parseInt(item['Estoque Mínimo'])) {
            row.classList.add('estoque-baixo-row');
        }
        row.innerHTML = `
            <td>${item['Tipo de Papel']}</td>
            <td>${item['Marca'] || ''}</td>
            <td>${item['Tamanho']}</td>
            <td>${item['Quantidade de Pacotes']}</td>
            <td>${item['Folhas por Pacote']}</td>
            <td>${item['Total de Folhas']}</td>
        `;
        tabelaEstoque.appendChild(row);
    });
}

function popularSelects() {
    tipoPapelBaixaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    tipoPapelEntradaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    estoquePapeis.forEach((item, index) => {
        const optionText = `${item['Tipo de Papel']} (${item['Marca']}) - ${item['Tamanho']}`;
        const optionBaixa = new Option(optionText, index);
        const optionEntrada = new Option(optionText, index);
        tipoPapelBaixaSelect.add(optionBaixa);
        tipoPapelEntradaSelect.add(optionEntrada);
    });
}

// --- Funções de Login e Fluxo do Modal ---

function mostrarView(viewToShow) {
    loginView.classList.add('hidden');
    formBaixaView.classList.add('hidden');
    formEntradaView.classList.add('hidden');
    viewToShow.classList.remove('hidden');
}

function handleLogin(e) {
    e.preventDefault();
    if (passwordInput.value === "1cafez!n") {
        if (acaoAtual === 'baixa') {
            mostrarView(formBaixaView);
            popularSelects();
        } else if (acaoAtual === 'entrada') {
            mostrarView(formEntradaView);
            popularSelects();
        }
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

function gerarCsvParaDownload() { /* ... implementação existente ... */ }

// --- Eventos ---
openBaixaModalBtn.addEventListener('click', () => {
    acaoAtual = 'baixa';
    estoqueModal.classList.remove('hidden');
    mostrarView(loginView);
    passwordInput.focus();
});

openEntradaModalBtn.addEventListener('click', () => {
    acaoAtual = 'entrada';
    estoqueModal.classList.remove('hidden');
    mostrarView(loginView);
    passwordInput.focus();
});

closeModalBtn.addEventListener('click', () => estoqueModal.classList.add('hidden'));
loginForm.addEventListener('submit', handleLogin);
downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);

// Evento para o formulário de BAIXA
formBaixa.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemIndex = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value, 10);
    const item = estoquePapeis[itemIndex];
    if (quantidade > parseInt(item['Total de Folhas'])) {
        mensagemBaixa.innerHTML = 'Erro: Quantidade insuficiente em estoque.';
        return;
    }
    item['Total de Folhas'] = parseInt(item['Total de Folhas']) - quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);
    salvarDadosNoLocalStorage();
    renderizarTabela();
    mensagemBaixa.innerHTML = 'Baixa registrada com sucesso!';
    formBaixa.reset();
    popularSelects();
});

// Evento para o formulário de ENTRADA
formEntrada.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemIndex = tipoPapelEntradaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeEntrada').value, 10);
    const item = estoquePapeis[itemIndex];
    item['Total de Folhas'] = parseInt(item['Total de Folhas']) + quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);
    salvarDadosNoLocalStorage();
    renderizarTabela();
    mensagemEntrada.innerHTML = 'Entrada registrada com sucesso!';
    formEntrada.reset();
    popularSelects();
});

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    localStorage.removeItem('estoquePapeis');
    let dadosCarregados;
    try {
        dadosCarregados = await parseCSV(CSV_FILE_PATH + '?v=' + new Date().getTime());
    } catch (error) {
        tabelaEstoque.innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
        return;
    }
    estoquePapeis = aplicarRegrasDeEstoque(dadosCarregados);
    salvarDadosNoLocalStorage();
    renderizarTabela();
});
