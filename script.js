// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
const USUARIO_PADRAO = "designer";
const SENHA_PADRAO = "1cafez!n"; // A senha CORRETA!
const REGRAS_ESTOQUE_BAIXO = {
    "Offset": 2000,
    "Couche Brilho": 2000,
    "Couche Fosco": 2000,
    "Sulphite": 1000,
    "Adesivo Vinil": 500,
    "Adesivo Papel": 1000,
    "Duplex": 500,
    "Triplex": 500,
    "Color Plus": 500,
    "Kraft": 500,
    "Fotográfico": 100,
    "Reciclado": 500,
    "Sublimático": 500
};

// --- FUNÇÕES AUXILIARES ---

function formatarData(data) {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `<span class="math-inline">\{dia\}/</span>{mes}/${ano}`;
}

// --- FUNÇÃO PRINCIPAL PARA ENVIAR DADOS PARA NOSSA API DE ATUALIZAÇÃO (Backend) ---

async function enviarParaAPI(linhaCSVCompleta) {
    try {
        const response = await fetch('/api/atualizar-estoque', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Informamos que estamos enviando texto puro
            },
            body: linhaCSVCompleta, // Enviamos a linha CSV como corpo da requisição
        });

        if (response.ok) {
            const resultado = await response.json();
            alert('Sucesso: ' + resultado.message);
            console.log('Dados enviados com sucesso:', resultado);
            carregarEstoque(); // Atualiza a tabela após a operação
        } else {
            const errorText = await response.text(); // Pega a resposta como texto
            alert('Erro: ' + errorText);
            console.error('Erro ao enviar dados para a API:', errorText);
        }
    } catch (erro) {
        alert('Ocorreu um erro de conexão. Verifique sua internet ou tente novamente.');
        console.error('Erro na requisição fetch:', erro);
    }
}


// --- FUNÇÃO: CARREGAR ESTOQUE DA API E EXIBIR NA TABELA ---

async function carregarEstoque() {
    const corpoTabela = document.getElementById('corpoTabelaEstoque');
    if (!corpoTabela) {
        console.error("Elemento 'corpoTabelaEstoque' não encontrado.");
        return;
    }

    corpoTabela.innerHTML = ''; // Limpa a tabela antes de preencher

    try {
        const response = await fetch('/api/ler-estoque');

        if (response.ok) {
            const csvContent = await response.text();
            const linhas = csvContent.split('\n').filter(line => line.trim() !== '');

            const dados = linhas.slice(1); // Ignora a linha do cabeçalho para os dados

            if (dados.length === 0) {
                const row = corpoTabela.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 6; // Número de colunas da sua tabela
                cell.textContent = 'Nenhum item no estoque ainda.';
                cell.style.textAlign = 'center';
                return;
            }

            // Preenche a tabela com os dados do estoque
            dados.forEach(linha => {
                const colunas = linha.split(';'); // Divide a linha por ponto e vírgula
                const row = corpoTabela.insertRow();

                // Mapeia as colunas do CSV para as células da tabela HTML
                // Ordem das colunas no seu CSV: Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas
                const tipoPapel = colunas[0] ? colunas[0].trim() : '';
                const qtdPacotes = parseFloat(colunas[3]) || 0; // Coluna 3 para Qtd. Pacotes

                row.insertCell(0).textContent = tipoPapel; // Tipo de Papel
                row.insertCell(1).textContent = colunas[1] ? colunas[1].trim() : ''; // Marca
                row.insertCell(2).textContent = colunas[2] ? colunas[2].trim() : ''; // Tamanho
                row.insertCell(3).textContent = colunas[3] ? colunas[3].trim() : ''; // Qtd. Pacotes
                row.insertCell(4).textContent = colunas[4] ? colunas[4].trim() : ''; // Folhas/Pct.
                row.insertCell(5).textContent = colunas[5] ? colunas[5].trim() : ''; // Total Folhas

                // Lógica de Estoque Baixo: Aplica a classe se a quantidade estiver abaixo do limite
                if (REGRAS_ESTOQUE_BAIXO[tipoPapel] !== undefined && qtdPacotes < REGRAS_ESTOQUE_BAIXO[tipoPapel]) {
                    row.classList.add('estoque-baixo');
                }
            });

        } else {
            const errorText = await response.text();
            console.error('Erro ao carregar estoque da API:', errorText);
            const row = corpoTabela.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'Erro ao carregar o estoque.';
            cell.style.color = 'red';
        }
    } catch (erro) {
        console.error('Erro de conexão ao carregar estoque:', erro);
        const row = corpoTabela.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6;
        cell.textContent = 'Problema de conexão ao carregar estoque.';
        cell.style.color = 'red';
    }
}

// --- FUNÇÕES DE ENTRADA/SAÍDA ---

function registrarEntrada() {
    const inputTipoPapel = document.getElementById('inputTipoPapelEntrada');
    const inputMarca = document.getElementById('inputMarcaEntrada');
    const inputTamanho = document.getElementById('inputTamanhoEntrada');
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const inputFolhasPct = document.getElementById('inputFolhasPctEntrada');
    const inputTotalFolhas = document.getElementById('inputTotalFolhasEntrada');

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const marca = inputMarca ? inputMarca.value.trim() : '';
    const tamanho = inputTamanho ? inputTamanho.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const folhasPct = parseFloat(inputFolhasPct ? inputFolhasPct.value : '0');
    const totalFolhas = parseFloat(inputTotalFolhas ? inputTotalFolhas.value : '0');

    if (!tipoPapel || isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, preencha o Tipo de Papel e uma Quantidade válida de pacotes para a entrada.');
        return;
    }

    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{marca};<span class="math-inline">\{tamanho\};</span>{quantidade};<span class="math-inline">\{folhasPct\};</span>{totalFolhas}`;

    enviarParaAPI(linhaCSV);

    // Limpa os campos após o envio
    if (inputTipoPapel) inputTipoPapel.value = '';
    if (inputMarca) inputMarca.value = '';
    if (inputTamanho) inputTamanho.value = '';
    inputQuantidade.value = '';
    if (inputFolhasPct) inputFolhasPct.value = '';
    if (inputTotalFolhas) inputTotalFolhas.value = '';
}


function registrarBaixa() {
    const inputTipoPapel = document.getElementById('inputTipoPapelBaixa');
    const inputQuantidade = document.getElementById('quantidadeBaixa');
    const inputUsoBaixa = document.getElementById('inputUsoBaixa');

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const uso = inputUsoBaixa ? inputUsoBaixa.value.trim() : '';

    if (!tipoPapel || isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, preencha o Tipo de Papel e uma Quantidade válida de pacotes para a baixa.');
        return;
    }

    // Para baixa, registramos o valor NEGATIVO da quantidade.
    // O campo 'Uso' está sendo inserido na segunda coluna (Marca) para manter a estrutura de 6 colunas.
    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{uso};;;${-quantidade};;`; // Tipo;Uso;Tamanho;Qtd(negativo);FolhasPct;TotalFolhas

    enviarParaAPI(linhaCSV);

    if (inputTipoPapel) inputTipoPapel.value = '';
    inputQuantidade.value = '';
    if (inputUsoBaixa) inputUsoBaixa.value = '';
}


// --- FUNÇÃO: BAIXAR CSV ---

async function baixarCSV() {
    try {
        const response = await fetch('/api/ler-estoque');
        if (response.ok) {
            const csvContent = await response.text();

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Controle_de_Papeis_Atualizado.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('Erro ao baixar o CSV.');
            console.error('Erro ao baixar CSV:', await response.text());
        }
    } catch (error) {
        alert('Ocorreu um erro ao tentar baixar o CSV.');
        console.error('Erro de conexão ao baixar CSV:', error);
    }
}

// --- LÓGICA DE LOGIN ---

function handleLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const loginMessage = document.getElementById('loginMessage');
    const loginPopup = document.getElementById('loginPopup');
    const movimentacaoSection = document.getElementById('movimentacaoSection');

    if (username === USUARIO_PADRAO && password === SENHA_PADRAO) {
        loginPopup.style.display = 'none'; // Esconde o pop-up
        movimentacaoSection.style.display = 'block'; // Mostra a seção de movimentação
        loginMessage.textContent = ''; // Limpa qualquer mensagem de erro
        alert('Login bem-sucedido! Seção de movimentação liberada.');
    } else {
        loginMessage.textContent = 'Usuário ou senha incorretos.';
    }
}


// --- CONEXÃO DOS BOTÕES E CARREGAMENTO INICIAL ---

document.addEventListener('DOMContentLoaded', () => {
    // Esconder a seção de movimentação no início (o CSS já faz isso, mas é um reforço)
    document.getElementById('movimentacaoSection').style.display = 'none';

    // Conecta o botão de login
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // Exibir o pop-up de login ao carregar a página
    document.getElementById('loginPopup').style.display = 'flex'; // Usar flex para centralizar o pop-up

    // Conexão dos botões de entrada/baixa/download
    const btnEntrada = document.getElementById('btnEntrada');
    const btnBaixa = document.getElementById('btnBaixa');
    const btnDownloadCSV = document.getElementById('btnDownloadCSV');

    if (btnEntrada) {
        btnEntrada.addEventListener('click', registrarEntrada);
    } else {
        console.error("Botão 'btnEntrada' não encontrado!");
    }
    if (btnBaixa) {
        btnBaixa.addEventListener('click', registrarBaixa);
    } else {
        console.error("Botão 'btnBaixa' não encontrado!");
    }
    if (btnDownloadCSV) {
        btnDownloadCSV.addEventListener('click', baixarCSV);
    } else {
        console.error("Botão 'btnDownloadCSV' não encontrado!");
    }

    // Carrega a tabela assim que a página é carregada (para exibir o estoque existente)
    carregarEstoque();
});
