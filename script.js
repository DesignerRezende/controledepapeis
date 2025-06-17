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
        console.error("Falha ao carregar ou processar o CSV:", error);
        throw error;
    }
}

function renderizarTabela() {
    tabelaEstoque.innerHTML = '';
    estoquePapeis.forEach(item => {
        const row = document.createElement('tr');

        // ADICIONA CLASSE VERMELHA SE O ESTOQUE ESTIVER BAIXO
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
            li.textContent = `Atenção: ${item['Tipo de Papel']} (${item['Marca']}) está com apenas ${item['Total de Folhas']} folhas. (Mínimo: ${item['Estoque Mínimo']})`;
            listaEstoqueBaixo.appendChild(li);
        });
    }
}

function popularSelectBaixa() {
    tipoPapelBaixaSelect.innerHTML = '<option value="" disabled selected>Selecione um papel</option>';
    estoquePapeis.forEach((item, index) => {
        const optionText = `${item['Tipo de Papel']} (${item['Marca']}) - ${item['Tamanho']}`;
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
    mensagemBaixa.innerHTML = ''; // Limpa a mensagem
    popularSelectBaixa();
}

function handleLogin(e) {
    e.preventDefault();
    if (passwordInput.value === "1cafez!n") {
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
    if (estoquePapeis.length === 0) {
        alert("Não há dados para baixar.");
        return;
    }
    const headers = Object.keys(estoquePapeis[0]);
    let csvContent = headers.join(";") + "\r\n";
    estoquePapeis.forEach(item => {
        const row = headers.map(h => `"${String(item[h]).replace(/"/g, '""')}"`).join(";");
        csvContent += row + "\r\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Controle_de_Papeis_Atualizado.csv";
    link.click();
}

// --- Eventos ---

openBaixaModalBtn.addEventListener('click', () => {
    baixaModal.classList.remove('hidden');
    mostrarViewLogin();
});

closeModalBtn.addEventListener('click', () => baixaModal.classList.add('hidden'));
loginForm.addEventListener('submit', handleLogin);
downloadCsvBtn.addEventListener('click', gerarCsvParaDownload);

formBaixa.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemIndex = tipoPapelBaixaSelect.value;
    const quantidade = parseInt(document.getElementById('quantidadeBaixa').value, 10);
    const item = estoquePapeis[itemIndex];

    if (itemIndex === "" || !quantidade) {
        mensagemBaixa.innerHTML = 'Por favor, preencha todos os campos.';
        mensagemBaixa.className = 'error';
        return;
    }

    if (quantidade > parseInt(item['Total de Folhas'])) {
        mensagemBaixa.innerHTML = 'Erro: Quantidade insuficiente em estoque.';
        mensagemBaixa.className = 'error';
        return;
    }

    item['Total de Folhas'] = parseInt(item['Total de Folhas']) - quantidade;
    item['Quantidade de Pacotes'] = (item['Total de Folhas'] / parseInt(item['Folhas por Pacote'])).toFixed(2);
    
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();

    // MENSAGEM DE SUCESSO MELHORADA
    mensagemBaixa.innerHTML = `Baixa registrada!<br><strong>Lembre-se:</strong> para salvar permanentemente, clique em "Baixar Estoque Atualizado" e substitua o arquivo CSV.`;
    mensagemBaixa.className = 'success';
    formBaixa.reset();
    popularSelectBaixa();
});

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    localStorage.removeItem('estoquePapeis'); // Garante que sempre leia o CSV mais recente

    let dadosCarregados;
    try {
        dadosCarregados = await parseCSV(CSV_FILE_PATH + '?v=' + new Date().getTime());
    } catch (error) {
        tabelaEstoque.innerHTML = `<tr<td colspan="6">Erro ao carregar dados. Verifique o arquivo CSV e a conexão.</td></tr>`;
        return;
    }
    
    estoquePapeis = aplicarRegrasDeEstoque(dadosCarregados);
    salvarDadosNoLocalStorage();
    renderizarTabela();
    renderizarAlertaEstoqueBaixo();
});
