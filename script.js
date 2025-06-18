// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
const SENHA_PADRAO = "1cafez!n";

// estoqueAtualCompleto agora armazenará todos os dados de cada item, incluindo gramatura e estoque mínimo
let estoqueAtualCompleto = [];

// Variável para guardar qual operação o usuário clicou (entrada ou baixa)
let tipoOperacaoAtual = null;

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
        // CORREÇÃO: URL da API para o padrão do Netlify Functions
        const response = await fetch('/.netlify/functions/api-atualizar-estoque', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: linhaCSVCompleta,
        });

        if (response.ok) {
            const resultado = await response.json();
            console.log('Dados enviados com sucesso:', resultado);
            carregarEstoque(); // Atualiza a tabela após a operação

            // Fecha o pop-up e reseta para o estado de login
            document.getElementById('loginMovimentacaoPopup').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block'; // Mostra o formulário de login novamente
            document.getElementById('entradaSection').style.display = 'none';
            document.getElementById('baixaSection').style.display = 'none';
            document.getElementById('passwordInput').value = ''; // Limpa a senha
            document.getElementById('loginMessage').textContent = ''; // Limpa mensagem de erro

        } else {
            const errorText = await response.text(); // Pega a resposta como texto
            alert('Erro: ' + errorText);
            console.error('Erro ao enviar dados para a API:', errorText);
        }
    } catch (erro) {
        alert('Ocorreu um erro de conexão. Verifique sua internet ou inesperado: ' + erro.message);
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
    estoqueAtualCompleto = []; // Limpa os dados do estoque para recarregar

    try {
        // CORREÇÃO: URL da API para o padrão do Netlify Functions
        const response = await fetch('/.netlify/functions/api-ler-estoque');

        if (response.ok) {
            const csvContent = await response.text();
            const linhas = csvContent.split('\n').filter(line => line.trim() !== '');

            const dados = linhas.slice(1); // Ignora a linha do cabeçalho para os dados

            if (dados.length === 0) {
                const row = corpoTabela.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 7;
                cell.textContent = 'Nenhum item no estoque ainda.';
                cell.style.textAlign = 'center';
                return;
            }

            dados.forEach(linha => {
                const colunas = linha.split(';');
                const row = corpoTabela.insertRow();

                // Mapeia as colunas do CSV para as células da tabela HTML
                // Ordem das colunas no seu CSV: Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas;Estoque Mínimo
                const tipoPapel = colunas[0] ? colunas[0].trim() : '';
                const gramatura = colunas[1] ? colunas[1].trim() : '';
                const qtdPacotes = parseFloat(colunas[4]) || 0;
                const totalFolhas = parseFloat(colunas[6]) || 0;
                const estoqueMinimo = parseFloat(colunas[7]) || 0;

                row.insertCell(0).textContent = tipoPapel;
                row.insertCell(1).textContent = gramatura;
                row.insertCell(2).textContent = colunas[2] ? colunas[2].trim() : ''; // Marca
                row.insertCell(3).textContent = colunas[3] ? colunas[3].trim() : ''; // Tamanho
                row.insertCell(4).textContent = colunas[4] ? colunas[4].trim() : ''; // Qtd. Pacotes
                row.insertCell(5).textContent = colunas[5] ? colunas[5].trim() : ''; // Folhas/Pct.
                row.insertCell(6).textContent = colunas[6] ? colunas[6].trim() : ''; // Total Folhas

                estoqueAtualCompleto.push({
                    tipoPapel: tipoPapel,
                    gramatura: gramatura,
                    marca: colunas[2] ? colunas[2].trim() : '',
                    tamanho: colunas[3] ? colunas[3].trim() : '',
                    qtdPacotes: qtdPacotes,
                    folhasPct: parseFloat(colunas[5]) || 0,
                    totalFolhas: totalFolhas,
                    estoqueMinimo: estoqueMinimo
                });

                if (totalFolhas < estoqueMinimo) {
                    row.classList.add('estoque-baixo');
                }
            });

        } else {
            const errorText = await response.text();
            console.error('Erro ao carregar estoque da API:', errorText);
            const row = corpoTabela.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = 'Erro ao carregar o estoque.';
            cell.style.color = 'red';
        }
    } catch (erro) {
        console.error('Erro de conexão ao carregar estoque:', erro);
        const row = corpoTabela.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 7;
        cell.textContent = 'Problema de conexão ao carregar estoque.';
        cell.style.color = 'red';
    }
}

// --- FUNÇÃO: POPULAR DROPDOWNS PARA BAIXA ---
// Esta função é chamada SOMENTE quando o pop-up de baixa é aberto
function popularDropdownsBaixa() {
    const selectTipoPapel = document.getElementById('inputTipoPapelBaixa');
    const selectGramatura = document.getElementById('inputGramaturaBaixa');

    if (!selectTipoPapel || !selectGramatura) return;

    selectTipoPapel.innerHTML = '<option value="">Selecione o Tipo de Papel</option>';
    selectGramatura.innerHTML = '<option value="">Selecione a Gramatura</option>';

    const tiposUnicos = [...new Set(estoqueAtualCompleto.map(item => item.tipoPapel))].sort();
    tiposUnicos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        selectTipoPapel.appendChild(option);
    });

    selectTipoPapel.removeEventListener('change', handleTipoPapelBaixaChange);
    selectTipoPapel.addEventListener('change', handleTipoPapelBaixaChange);
}

function handleTipoPapelBaixaChange() {
    const selectTipoPapel = document.getElementById('inputTipoPapelBaixa');
    const selectGramatura = document.getElementById('inputGramaturaBaixa');

    const tipoSelecionado = selectTipoPapel.value;
    selectGramatura.innerHTML = '<option value="">Selecione a Gramatura</option>';

    if (tipoSelecionado) {
        const gramaturasUnicas = [...new Set(estoqueAtualCompleto
            .filter(item => item.tipoPapel === tipoSelecionado && item.gramatura)
            .map(item => item.gramatura)
        )].sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            return numA - numB;
        });

        gramaturasUnicas.forEach(gramatura => {
            const option = document.createElement('option');
            option.value = gramatura;
            option.textContent = gramatura;
            selectGramatura.appendChild(option);
        });
    }
}

// --- CÁLCULO AUTOMÁTICO DE TOTAL FOLHAS NA ENTRADA ---
function calcularTotalFolhasEntrada() {
    const qtdPacotesInput = document.getElementById('quantidadeEntrada');
    const folhasPctInput = document.getElementById('inputFolhasPctEntrada');
    const totalFolhasInput = document.getElementById('inputTotalFolhasEntrada');

    const qtdPacotes = parseFloat(qtdPacotesInput.value);
    const folhasPct = parseFloat(folhasPctInput.value);

    if (!isNaN(qtdPacotes) && !isNaN(folhasPct) && qtdPacotes >= 0 && folhasPct >= 0) {
        totalFolhasInput.value = (qtdPacotes * folhasPct).toFixed(0);
    } else {
        totalFolhasInput.value = '';
    }
}

// --- FUNÇÕES DE ENTRADA/SAÍDA (CHAMADAS APÓS LOGIN) ---

function registrarEntrada() {
    const inputTipoPapel = document.getElementById('inputTipoPapelEntrada');
    const inputGramatura = document.getElementById('inputGramaturaEntrada');
    const inputMarca = document.getElementById('inputMarcaEntrada');
    const inputTamanho = document.getElementById('inputTamanhoEntrada');
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const inputFolhasPct = document.getElementById('inputFolhasPctEntrada');
    const inputTotalFolhas = document.getElementById('inputTotalFolhasEntrada');

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const gramatura = inputGramatura ? inputGramatura.value.trim() : '';
    const marca = inputMarca ? inputMarca.value.trim() : '';
    const tamanho = inputTamanho ? inputTamanho.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const folhasPct = parseFloat(inputFolhasPct ? inputFolhasPct.value : '0');
    const totalFolhas = parseFloat(inputTotalFolhas ? inputTotalFolhas.value : '0');

    let estoqueMinimoDoItem = 0;
    const itemExistente = estoqueAtualCompleto.find(item =>
        item.tipoPapel === tipoPapel && item.gramatura === gramatura &&
        item.marca === marca && item.tamanho === tamanho
    );
    if (itemExistente) {
        estoqueMinimoDoItem = itemExistente.estoqueMinimo;
    }

    if (!tipoPapel || !gramatura || !marca || !tamanho || isNaN(quantidade) || quantidade <= 0 || isNaN(folhasPct) || folhasPct <= 0 || isNaN(totalFolhas) || totalFolhas <= 0) {
        alert('Por favor, preencha todos os campos obrigatórios (Tipo de Papel, Gramatura, Marca, Tamanho, Qtd. Pacotes, Folhas/Pct., Total Folhas) para a entrada com valores válidos.');
        return;
    }

    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{gramatura};${marca};
