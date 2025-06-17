// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
const USUARIO_PADRAO = "designer";
const SENHA_PADRAO = "1cafez!n";
const REGRAS_ESTOQUE_BAIXO = {
    "Offset": 2000, "Couche Brilho": 2000, "Couche Fosco": 2000,
    "Sulphite": 1000, "Adesivo Vinil": 500, "Adesivo Papel": 1000,
    "Duplex": 500, "Triplex": 500, "Color Plus": 500,
    "Kraft": 500, "Fotográfico": 100, "Reciclado": 500, "Sublimático": 500
};

let estoqueAtualTiposPapel = []; // Para armazenar os tipos de papel para o dropdown da baixa
let tipoOperacaoAtual = null; // 'entrada' ou 'baixa' - para saber qual seção mostrar no pop-up

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
                'Content-Type': 'text/plain',
            },
            body: linhaCSVCompleta,
        });

        if (response.ok) {
            const resultado = await response.json();
            alert('Sucesso: ' + resultado.message);
            console.log('Dados enviados com sucesso:', resultado);
            carregarEstoque(); // Atualiza a tabela após a operação
            document.getElementById('movimentacaoPopup').style.display = 'none'; // Fecha o pop-up
        } else {
            const errorText = await response.text();
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
    estoqueAtualTiposPapel = []; // Limpa os tipos de papel para recarregar

    try {
        const response = await fetch('/api/ler-estoque');

        if (response.ok) {
            const csvContent = await response.text();
            const linhas = csvContent.split('\n').filter(line => line.trim() !== '');

            const dados = linhas.slice(1); // Ignora a linha do cabeçalho para os dados

            if (dados.length === 0) {
                const row = corpoTabela.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 6;
                cell.textContent = 'Nenhum item no estoque ainda.';
                cell.style.textAlign = 'center';
                return;
            }

            dados.forEach(linha => {
                const colunas = linha.split(';'); // Divide a linha por ponto e vírgula
                const row = corpoTabela.insertRow();

                const tipoPapel = colunas[0] ? colunas[0].trim() : '';
                const qtdPacotes = parseFloat(colunas[3]) || 0;

                row.insertCell(0).textContent = tipoPapel;
                row.insertCell(1).textContent = colunas[1] ? colunas[1].trim() : '';
                row.insertCell(2).textContent = colunas[2] ? colunas[2].trim() : '';
                row.insertCell(3).textContent = colunas[3] ? colunas[3].trim() : '';
                row.insertCell(4).textContent = colunas[4] ? colunas[4].trim() : '';
                row.insertCell(5).textContent = colunas[5] ? colunas[5].trim() : '';

                // Adiciona o tipo de papel à lista para o dropdown, evitando duplicatas
                if (tipoPapel && !estoqueAtualTiposPapel.includes(tipoPapel)) {
                    estoqueAtualTiposPapel.push(tipoPapel);
                }

                if (REGRAS_ESTOQUE_BAIXO[tipoPapel] !== undefined && qtdPacotes < REGRAS_ESTOQUE_BAIXO[tipoPapel]) {
                    row.classList.add('estoque-baixo');
                }
            });

            popularDropdownTipoPapelBaixa(); // Chama para popular o dropdown após carregar o estoque
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

// --- FUNÇÃO: POPULAR DROPDOWN DE TIPO DE PAPEL PARA BAIXA ---
function popularDropdownTipoPapelBaixa() {
    const selectElement = document.getElementById('inputTipoPapelBaixa');
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Selecione o Tipo de Papel</option>'; // Limpa e adiciona opção padrão

    estoqueAtualTiposPapel.sort().forEach(tipo => { // Ordena alfabeticamente
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        selectElement.appendChild(option);
    });
}

// --- CÁLCULO AUTOMÁTICO DE TOTAL FOLHAS NA ENTRADA ---
function calcularTotalFolhasEntrada() {
    const qtdPacotesInput = document.getElementById('quantidadeEntrada');
    const folhasPctInput = document.getElementById('inputFolhasPctEntrada');
    const totalFolhasInput = document.getElementById('inputTotalFolhasEntrada');

    const qtdPacotes = parseFloat(qtdPacotesInput.value);
    const folhasPct = parseFloat(folhasPctInput.value);

    if (!isNaN(qtdPacotes) && !isNaN(folhasPct) && qtdPacotes >= 0 && folhasPct >= 0) {
        totalFolhasInput.value = (qtdPacotes * folhasPct).toFixed(0); // Arredonda para 0 casas decimais
    } else {
        totalFolhasInput.value = ''; // Limpa se os valores não forem válidos
    }
}


// --- FUNÇÕES DE ENTRADA/SAÍDA (CHAMADAS APÓS LOGIN) ---

function registrarEntrada() {
    const inputTipoPapel = document.getElementById('inputTipoPapelEntrada');
    const inputMarca = document.getElementById('inputMarcaEntrada');
    const inputTamanho = document.getElementById('inputTamanhoEntrada');
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const inputFolhasPct = document.getElementById('inputFolhasPctEntrada');
    const inputTotalFolhas = document.getElementById('inputTotalFolhasEntrada'); // Este agora é automático

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const marca = inputMarca ? inputMarca.value.trim() : '';
    const tamanho = inputTamanho ? inputTamanho.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const folhasPct = parseFloat(inputFolhasPct ? inputFolhasPct.value : '0');
    const totalFolhas = parseFloat(inputTotalFolhas ? inputTotalFolhas.value : '0'); // Pega o valor já calculado

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
    const selectTipoPapel = document.getElementById('inputTipoPapelBaixa'); // Agora é um select
    const inputQuantidade = document.getElementById('quantidadeBaixa');
    const inputUsoBaixa = document.getElementById('inputUsoBaixa');

    const tipoPapel = selectTipoPapel ? selectTipoPapel.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const uso = inputUsoBaixa ? inputUsoBaixa.value.trim() : '';

    if (!tipoPapel || isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, selecione o Tipo de Papel e digite uma Quantidade válida de pacotes para a baixa.');
        return;
    }

    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{uso};;;${-quantidade};;`; 

    enviarParaAPI(linhaCSV);

    if (selectTipoPapel) selectTipoPapel.value = ''; // Limpa o select
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

// --- LÓGICA DE LOGIN E CONTROLE DE EXIBIÇÃO ---

function handleLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const loginMessage = document.getElementById('loginMessage');
    const loginForm = document.getElementById('loginForm');
    const entradaSection = document.getElementById('entradaSection');
    const baixaSection = document.getElementById('baixaSection');

    if (username === USUARIO_PADRAO && password === SENHA_PADRAO) {
        loginForm.style.display = 'none'; // Esconde o formulário de login
        loginMessage.textContent = ''; // Limpa qualquer mensagem de erro

        // Mostra a seção de movimentação correta com base na operação clicada
        if (tipoOperacaoAtual === 'entrada') {
            entradaSection.style.display = 'block';
            baixaSection.style.display = 'none';
        } else if (tipoOperacaoAtual === 'baixa') {
            baixaSection.style.display = 'block';
            entradaSection.style.display = 'none';
        }
        alert('Login bem-sucedido! Preencha os detalhes da movimentação.');

        // Limpa os campos de login após sucesso
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';

    } else {
        loginMessage.textContent = 'Usuário ou senha incorretos.';
    }
}


// --- CONEXÃO DOS BOTÕES E CARREGAMENTO INICIAL ---

document.addEventListener('DOMContentLoaded', () => {
    // Carrega a tabela assim que a página é carregada
    carregarEstoque();

    // Esconder as seções de movimentação dentro do pop-up e o próprio pop-up
    document.getElementById('movimentacaoPopup').style.display = 'none';
    document.getElementById('entradaSection').style.display = 'none';
    document.getElementById('baixaSection').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block'; // Garante que o form de login seja visível no pop-up

    // Conecta o botão de login dentro do pop-up
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // Conecta o botão de fechar o pop-up
    const closePopupButton = document.getElementById('closePopup');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', () => {
            document.getElementById('movimentacaoPopup').style.display = 'none';
            // Reseta o estado do pop-up para a próxima vez que for aberto
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('entradaSection').style.display = 'none';
            document.getElementById('baixaSection').style.display = 'none';
            document.getElementById('loginMessage').textContent = '';
            document.getElementById('usernameInput').value = '';
            document.getElementById('passwordInput').value = '';
        });
    }


    // Conecta os botões que ABREM o pop-up de movimentação
    const btnAbrirEntrada = document.getElementById('btnAbrirEntrada');
    const btnAbrirBaixa = document.getElementById('btnAbrirBaixa');

    if (btnAbrirEntrada) {
        btnAbrirEntrada.addEventListener('click', () => {
            tipoOperacaoAtual = 'entrada'; // Define a operação atual
            document.getElementById('movimentacaoPopup').style.display = 'flex'; // Abre o pop-up
            document.getElementById('loginForm').style.display = 'block'; // Mostra o formulário de login
            // Limpa campos para nova entrada
            document.getElementById('inputTipoPapelEntrada').value = '';
            document.getElementById('inputMarcaEntrada').value = '';
            document.getElementById('inputTamanhoEntrada').value = '';
            document.getElementById('quantidadeEntrada').value = '';
            document.getElementById('inputFolhasPctEntrada').value = '';
            document.getElementById('inputTotalFolhasEntrada').value = '';
        });
    }

    if (btnAbrirBaixa) {
        btnAbrirBaixa.addEventListener('click', () => {
            tipoOperacaoAtual = 'baixa'; // Define a operação atual
            document.getElementById('movimentacaoPopup').style.display = 'flex'; // Abre o pop-up
            document.getElementById('loginForm').style.display = 'block'; // Mostra o formulário de login
            popularDropdownTipoPapelBaixa(); // Popula o dropdown ao abrir a baixa
            // Limpa campos para nova baixa
            document.getElementById('inputTipoPapelBaixa').value = ''; // Limpa o select
            document.getElementById('quantidadeBaixa').value = '';
            document.getElementById('inputUsoBaixa').value = '';
        });
    }

    // Conecta os botões REAIS de confirmar entrada/baixa (dentro do pop-up)
    const btnEntradaConfirmar = document.getElementById('btnEntradaConfirmar');
    const btnBaixaConfirmar = document.getElementById('btnBaixaConfirmar');
    const btnDownloadCSV = document.getElementById('btnDownloadCSV');

    if (btnEntradaConfirmar) {
        btnEntradaConfirmar.addEventListener('click', registrarEntrada);
    } else {
        console.error("Botão 'btnEntradaConfirmar' não encontrado!");
    }
    if (btnBaixaConfirmar) {
        btnBaixaConfirmar.addEventListener('click', registrarBaixa);
    } else {
        console.error("Botão 'btnBaixaConfirmar' não encontrado!");
    }
    if (btnDownloadCSV) {
        btnDownloadCSV.addEventListener('click', baixarCSV);
    } else {
        console.error("Botão 'btnDownloadCSV' não encontrado!");
    }

    // Event Listeners para cálculo de Total Folhas na Entrada
    const qtdPacotesEntrada = document.getElementById('quantidadeEntrada');
    const folhasPctEntrada = document.getElementById('inputFolhasPctEntrada');

    if (qtdPacotesEntrada) {
        qtdPacotesEntrada.addEventListener('input', calcularTotalFolhasEntrada);
    }
    if (folhasPctEntrada) {
        folhasPctEntrada.addEventListener('input', calcularTotalFolhasEntrada);
    }
});
