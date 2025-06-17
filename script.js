// --- Variáveis Globais ---
let estoquePapeis = [];
const CSV_FILE_PATH = 'Controle_de_Papeis.csv';

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const listaEstoqueBaixo = document.getElementById('lista-estoque-baixo');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const baixaModal = document.getElementById('baixa-modal');
const openBaixaModalBtn = document.getElementById('open-baixa-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const loginView = document.getElementById('login-view');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const formBaixaView = document.getElementById('form-baixa-view');
const formBaixa = document.getElementById('form-baixa');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');

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
    console.log("--- DIAGNÓSTICO: Aplicando Regras de Estoque ---");
    const dadosAtualizados = dados.map(item => {
        const estoqueMinimoCalculado = getEstoqueMinimo(item['Folhas por Pacote']);
        console.log(`Item: ${item['Tipo de Papel']}, Folhas/Pct: ${item['Folhas por Pacote']}, Mínimo Calculado: ${estoqueMinimoCalculado}`);
        item['Estoque Mínimo'] = estoqueMinimoCalculado;
        return item;
    });
    console.log("--- FIM DO DIAGNÓSTICO ---");
    return dadosAtualizados;
}

async function parseCSV(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.trim().split('\n');
        // ATENÇÃO: Verifique se os nomes dos cabeçalhos no seu CSV são exatamente estes.
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

function renderizarTabela() {
    tabelaEstoque.innerHTML = '';
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');
        // Adicionada a célula para a Marca
        row.innerHTML = `
            <td>${item['Marca'] || ''}</td>
            <td>${item['Tipo de Papel']}</td>
            <td>${item['Tamanho']}</td>
            <td>${item['Quantidade de Pacotes']}</td>
            <td>${item['Folhas por Pacote']}</td>
            <td>${item['Total de Folhas']}</td>
        `;
        tabelaEstoque.appendChild(row);
    });
}

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
            li.textContent = `Atenção: ${item['Marca']} ${item['Tipo de Papel']} (${item['Tamanho']}) está com apenas ${item['Total de Folhas']} folhas. (Mínimo: ${item['Estoque Mínimo']})`;
            listaEstoqueBaixo.appendChild(li);
        });
    }
}

function popularSelectBaixa() {
    tipoPapelBaixaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    estoquePapeis.forEach((item, index) => {
        // Adicionada a Marca no texto da opção
        const optionText = `${item['Marca']} - ${item['Tipo de Papel']} - ${item['Tamanho']}`;
        const option = new Option(optionText, index);
        tipoPapelBaixaSelect.add(option);
    });
}

// --- Funções de Login e Fluxo do Modal ---

function mostrarViewLogin() {
    formBaixaView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginError.textContent = '';
    passwordInput.value = '';
    passwordInput.focus();
}

function mostrarViewFormBaixa() {
    loginView.classList.add('hidden');
    formBaixaView.classList.remove('hidden');
    mensagemBaixa.textContent = '';
    popularSelectBaixa();
}

function handleLogin(e) {
    e.preventDefault();
    const correctPassword = "1cafez!n";
    if (passwordInput.value === correctPassword) {
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
    // Implementação da função de download
}

// --- Eventos ---

openBaixaModalBtn.addEventListener('click', () => {
    baixaModal.classList.remove('hidden');
    mostrarViewLogin(); // Sempre mostra o login primeiro
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
        mensagemBaixa.textContent = 'Erro: Quantidade insuficiente em estoque.';
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
    popularSelectBaixa();
});

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    let dadosCarregados = carregarDadosDoLocalStorage();
    if (!dadosCarregados) {
        try {
            dadosCarregados = await parseCSV(CSV_FILE_PATH);
        } catch (error) {
            // Colspan atualizado para 6 colunas
            tabelaEstoque.innerHTML = '<tr><td colspan="6">Erro ao carregar dados.</td></tr>';
            return;
        }
    }
    estoquePapeis = aplicarRegrasDeEstoque(dadosCarregados);
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
});
