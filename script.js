// --- Variáveis Globais ---
let estoquePapeis = [];
let historicoUso = [];
const CSV_FILE_PATH = 'Controle_de_Papeis.csv';

// --- Elementos do DOM ---
const tabelaEstoque = document.getElementById('tabela-estoque');
const tipoPapelBaixaSelect = document.getElementById('tipoPapelBaixa');
const formBaixa = document.getElementById('form-baixa');
const mensagemBaixa = document.getElementById('mensagem-baixa');
const listaEstoqueBaixo = document.getElementById('lista-estoque-baixo');
const listaPapeisUsados = document.getElementById('lista-papeis-usados');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

// Elementos para o Modal de Login
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const openLoginBtn = document.getElementById('open-login-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const formBaixaContainer = document.getElementById('form-baixa-container');


// --- Funções Principais ---

/**
 * Define o estoque mínimo com base na quantidade de folhas por pacote.
 * REGRA ATUALIZADA
 * @param {number | string} folhasPorPacote - A quantidade de folhas no pacote.
 * @returns {number} O estoque mínimo de folhas.
 */
function getEstoqueMinimo(folhasPorPacote) {
    const folhas = parseInt(folhasPorPacote, 10);
    if (folhas === 100) return 40;
    if (folhas === 50) return 20; // Novo valor
    if (folhas === 20) return 8;  // Novo valor
    if (folhas === 10) return 4;  // Novo valor
    return 0; // Padrão
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
            if (!lines[i]) continue;
            const values = lines[i].trim().split(';');
            if (values.length === headers.length) {
                const obj = {};
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = values[j];
                }
                obj['Estoque Mínimo'] = getEstoqueMinimo(obj['Folhas por Pacote']);
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
 */
function renderizarTabela() {
    tabelaEstoque.innerHTML = '';
    if (estoquePapeis.length === 0) {
        // Ajustado para 5 colunas visíveis
        tabelaEstoque.innerHTML = '<tr><td colspan="5">Nenhum dado de estoque encontrado.</td></tr>';
        return;
    }
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');
        row.id = `item-${item['Tipo de Papel'].replace(/\s+/g, '-')}-${item['Tamanho']}`;
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
            li.textContent = `Atenção: ${item['Tipo de Papel']} (${item['Tamanho']}) está com apenas ${item['Total de Folhas']} folhas. (Mínimo: ${item['Estoque Mínimo']})`;
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
        option.value = index;
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
    const headers = Object.keys(estoquePapeis[0]);
    let csvContent = headers.join(";") + "\r\n";
    estoquePapeis.forEach(item => {
        const row = headers.map(header => {
            let value = item[header];
            if (typeof value === 'string' && value.includes(';')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += row.join(";") + "\r\n";
    });
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

// --- Funções de Login ---

/**
 * Verifica se o usuário já fez login na sessão atual.
 */
function checkLoginState() {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        formBaixaContainer.classList.remove('hidden');
        openLoginBtn.classList.add('hidden');
    }
}

/**
 * Processa a tentativa de login.
 * @param {Event} e - O evento de submissão do formulário.
 */
function handleLogin(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const correctPassword = "1cafez!n";

    if (passwordInput.value === correctPassword) {
        sessionStorage.setItem('loggedIn', 'true');
        loginModal.classList.add('hidden');
        checkLoginState(); // Mostra o formulário e esconde o botão de acesso
        loginError.textContent = '';
        passwordInput.value = '';
    } else {
        loginError.textContent = 'Senha incorreta. Tente novamente.';
        passwordInput.focus();
    }
}


// --- Funções de Persistência (LocalStorage) ---
function salvarDadosNoLocalStorage() {
    localStorage.setItem('estoquePapeis', JSON.stringify(estoquePapeis));
    localStorage.setItem('historicoUso', JSON.stringify(historicoUso));
}

function carregarDadosDoLocalStorage() {
    const estoqueSalvo = localStorage.getItem('estoquePapeis');
    const historicoSalvo = localStorage.getItem('historicoUso');
    if (estoqueSalvo) estoquePapeis = JSON.parse(estoqueSalvo);
    if (historicoSalvo) historicoUso = JSON.parse(historicoSalvo);
}

// --- Eventos ---
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
    item['Total de Folhas'] = parseInt(item['Total de Folhas']) - quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);
    historicoUso.push({
        tipo: item['Tipo de Papel'],
        tamanho: item['Tamanho'],
        quantidade: quantidade,
        finalidade: finalidade,
        data: new Date().toLocaleString('pt-BR')
    });
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
    mensagemBaixa.textContent = `Baixa de ${quantidade} folhas de ${item['Tipo de Papel']} registrada com sucesso!`;
    mensagemBaixa.className = 'success';
    formBaixa.reset();
});

downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);

// Eventos de Login
openLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
loginForm.addEventListener('submit', handleLogin);

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    carregarDadosDoLocalStorage();
    if (estoquePapeis.length === 0) {
        try {
            estoquePapeis = await parseCSV(CSV_FILE_PATH);
            salvarDadosNoLocalStorage();
        } catch (error) {
            tabelaEstoque.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
            return;
        }
    }
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
    popularSelectBaixa();
    checkLoginState(); // Verifica o estado do login ao carregar a página
});
