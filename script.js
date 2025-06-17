// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
// Usuário fixo, apenas a senha é pedida
const SENHA_PADRAO = "1cafez!n";

// Regras de estoque mínimo baseadas no valor da coluna "Estoque Mínimo" do CSV
// NÃO USAMOS MAIS REGRAS FIXAS POR FOLHAS/PACOTE NO JS, pois o CSV já tem o mínimo.

let estoqueAtualCompleto = []; // Para armazenar todos os dados do estoque para filtragem
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
    estoqueAtualCompleto = []; // Limpa os dados do estoque para recarregar

    try {
        const response = await fetch('/api/ler-estoque');

        if (response.ok) {
            const csvContent = await response.text();
            const linhas = csvContent.split('\n').filter(line => line.trim() !== '');

            const dados = linhas.slice(1); // Ignora a linha do cabeçalho para os dados

            if (dados.length === 0) {
                const row = corpoTabela.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 8; // Número de colunas da sua tabela (agora 8)
                cell.textContent = 'Nenhum item no estoque ainda.';
                cell.style.textAlign = 'center';
                return;
            }

            dados.forEach(linha => {
                const colunas = linha.split(';'); // Divide a linha por ponto e vírgula
                const row = corpoTabela.insertRow();

                // Mapeia as colunas do CSV para as células da tabela HTML
                // Ordem das colunas no seu CSV: Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas;Estoque Mínimo
                const tipoPapel = colunas[0] ? colunas[0].trim() : '';
                const gramatura = colunas[1] ? colunas[1].trim() : '';
                const qtdPacotes = parseFloat(colunas[4]) || 0; // Qtd. Pacotes agora na coluna 4
                const folhasPct = parseFloat(colunas[5]) || 0; // Folhas/Pct. agora na coluna 5
                const totalFolhas = parseFloat(colunas[6]) || 0; // Total Folhas agora na coluna 6
                const estoqueMinimo = parseFloat(colunas[7]) || 0; // Estoque Mínimo agora na coluna 7

                row.insertCell(0).textContent = tipoPapel;
                row.insertCell(1).textContent = gramatura; // Gramatura
                row.insertCell(2).textContent = colunas[2] ? colunas[2].trim() : ''; // Marca
                row.insertCell(3).textContent = colunas[3] ? colunas[3].trim() : ''; // Tamanho
                row.insertCell(4).textContent = colunas[4] ? colunas[4].trim() : ''; // Qtd. Pacotes
                row.insertCell(5).textContent = colunas[5] ? colunas[5].trim() : ''; // Folhas/Pct.
                row.insertCell(6).textContent = colunas[6] ? colunas[6].trim() : ''; // Total Folhas
                row.insertCell(7).textContent = colunas[7] ? colunas[7].trim() : ''; // Estoque Mínimo

                // Armazena o item completo (objeto) para uso no dropdown de baixa
                estoqueAtualCompleto.push({
                    tipoPapel: tipoPapel,
                    gramatura: gramatura,
                    marca: colunas[2] ? colunas[2].trim() : '',
                    tamanho: colunas[3] ? colunas[3].trim() : '',
                    qtdPacotes: qtdPacotes,
                    folhasPct: folhasPct,
                    totalFolhas: totalFolhas,
                    estoqueMinimo: estoqueMinimo
                });

                // *** NOVA LÓGICA DE ESTOQUE BAIXO: Usa o Estoque Mínimo direto do CSV ***
                if (totalFolhas < estoqueMinimo) {
                    row.classList.add('estoque-baixo');
                }
            });

            popularDropdownsBaixa(); // Chama para popular os dropdowns após carregar o estoque
        } else {
            const errorText = await response.text();
            console.error('Erro ao carregar estoque da API:', errorText);
            const row = corpoTabela.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 8;
            cell.textContent = 'Erro ao carregar o estoque.';
            cell.style.color = 'red';
        }
    } catch (erro) {
        console.error('Erro de conexão ao carregar estoque:', erro);
        const row = corpoTabela.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 8;
        cell.textContent = 'Problema de conexão ao carregar estoque.';
        cell.style.color = 'red';
    }
}

// --- FUNÇÃO: POPULAR DROPDOWNS PARA BAIXA ---
function popularDropdownsBaixa() {
    const selectTipoPapel = document.getElementById('inputTipoPapelBaixa');
    const selectGramatura = document.getElementById('inputGramaturaBaixa');

    if (!selectTipoPapel || !selectGramatura) return;

    // Limpa e adiciona opção padrão para Tipo de Papel
    selectTipoPapel.innerHTML = '<option value="">Selecione o Tipo de Papel</option>';
    // Limpa e adiciona opção padrão para Gramatura (inicialmente vazia)
    selectGramatura.innerHTML = '<option value="">Selecione a Gramatura</option>';

    // Coleta tipos de papel únicos
    const tiposUnicos = [...new Set(estoqueAtualCompleto.map(item => item.tipoPapel))].sort();
    tiposUnicos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        selectTipoPapel.appendChild(option);
    });

    // Event listener para quando o Tipo de Papel muda
    selectTipoPapel.addEventListener('change', () => {
        const tipoSelecionado = selectTipoPapel.value;
        selectGramatura.innerHTML = '<option value="">Selecione a Gramatura</option>'; // Limpa ao mudar tipo

        if (tipoSelecionado) {
            // Filtra as gramaturas para o tipo de papel selecionado
            const gramaturasUnicas = [...new Set(estoqueAtualCompleto
                .filter(item => item.tipoPapel === tipoSelecionado)
                .map(item => item.gramatura)
            )].sort();

            gramaturasUnicas.forEach(gramatura => {
                const option = document.createElement('option');
                option.value = gramatura;
                option.textContent = gramatura;
                selectGramatura.appendChild(option);
            });
        }
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
    const inputGramatura = document.getElementById('inputGramaturaEntrada'); // Nova
    const inputMarca = document.getElementById('inputMarcaEntrada');
    const inputTamanho = document.getElementById('inputTamanhoEntrada');
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const inputFolhasPct = document.getElementById('inputFolhasPctEntrada');
    const inputTotalFolhas = document.getElementById('inputTotalFolhasEntrada');

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const gramatura = inputGramatura ? inputGramatura.value.trim() : ''; // Nova
    const marca = inputMarca ? inputMarca.value.trim() : '';
    const tamanho = inputTamanho ? inputTamanho.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const folhasPct = parseFloat(inputFolhasPct ? inputFolhasPct.value : '0');
    const totalFolhas = parseFloat(inputTotalFolhas ? inputTotalFolhas.value : '0');

    // Vamos buscar o estoque mínimo para este item, se ele já existe.
    // Se for uma entrada de um item novo, podemos deixar o estoque mínimo como vazio ou 0
    let estoqueMinimoDoItem = 0; // Valor padrão
    const itemExistente = estoqueAtualCompleto.find(item => 
        item.tipoPapel === tipoPapel && item.gramatura === gramatura &&
        item.marca === marca && item.tamanho === tamanho
    );
    if (itemExistente) {
        estoqueMinimoDoItem = itemExistente.estoqueMinimo;
    }
    // OBS: Se você quiser que o usuário possa definir o estoque mínimo na entrada de um NOVO item,
    // precisaria de um input para isso. Por enquanto, ele pega de um item existente ou é 0.

    if (!tipoPapel || !gramatura || isNaN(quantidade) || quantidade <= 0 || isNaN(folhasPct) || folhasPct <= 0 || isNaN(totalFolhas) || totalFolhas <= 0) {
        alert('Por favor, preencha todos os campos obrigatórios (Tipo de Papel, Gramatura, Qtd. Pacotes, Folhas/Pct., Total Folhas) para a entrada com valores válidos.');
        return;
    }

    // Nova ordem: Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas por Pacote;Total de Folhas;Estoque Mínimo
    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{gramatura};<span class="math-inline">\{marca\};</span>{tamanho};<span class="math-inline">\{</span>{quantidade}};<span class="math-inline">\{folhasPct\};</span>{totalFolhas};${estoqueMinimoDoItem}`;

    enviarParaAPI(linhaCSV);

    // Limpa os campos após o envio
    if (inputTipoPapel) inputTipoPapel.value = '';
    if (inputGramatura) inputGramatura.value = '';
    if (inputMarca) inputMarca.value = '';
    if (inputTamanho) inputTamanho.value = '';
    inputQuantidade.value = '';
    if (inputFolhasPct) inputFolhasPct.value = '';
    if (inputTotalFolhas) inputTotalFolhas.value = '';
}


function registrarBaixa() {
    const selectTipoPapel = document.getElementById('inputTipoPapelBaixa');
    const selectGramatura = document.getElementById('inputGramaturaBaixa'); // Nova
    const inputQuantidade = document.getElementById('quantidadeBaixa');
    const inputUsoBaixa = document.getElementById('inputUsoBaixa');

    const tipoPapel = selectTipoPapel ? selectTipoPapel.value.trim() : '';
    const gramatura = selectGramatura ? selectGramatura.value.trim() : ''; // Nova
    const quantidade = parseFloat(inputQuantidade.value);
    const uso = inputUsoBaixa ? inputUsoBaixa.value.trim() : '';

    if (!tipoPapel || !gramatura || isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, selecione o Tipo de Papel e a Gramatura e digite uma Quantidade válida de pacotes para a baixa.');
        return;
    }

    // Para baixa, registramos o valor NEGATIVO da quantidade.
    // O campo 'Uso' é colocado na coluna de Marca para manter a contagem de colunas.
    // Ordem: Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas por Pacote;Total de Folhas;Estoque Mínimo
    const linhaCSV = `<span class="math-inline">\{tipoPapel\};</span>{gramatura};<span class="math-inline">\{uso\};;;</span>{-quantidade};;`; 

    enviarParaAPI(linhaCSV);

    if (selectTipoPapel) selectTipoPapel.value = '';
    if (selectGramatura) selectGramatura.value = '';
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
    // Removido usernameInput
    const password = document.getElementById('passwordInput').value;
    const loginMessage = document.getElementById('loginMessage');
    const loginForm = document.getElementById('loginForm');
    const entradaSection = document.getElementById('entradaSection');
    const baixaSection = document.getElementById('baixaSection');

    if (password === SENHA_PADRAO) { // Apenas compara a senha
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

        // Limpa o campo de senha após sucesso
        document.getElementById('passwordInput').value = '';

    } else {
        loginMessage.textContent = 'Senha incorreta.';
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
    const passwordInput = document.getElementById('passwordInput'); // Para detectar Enter na senha

    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    if (passwordInput) {
        // Permite login com Enter
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });
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
            // Não precisa limpar usernameInput, pois ele foi removido
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
            document.getElementById('inputGramaturaEntrada').value = ''; // Novo
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
            popularDropdownsBaixa(); // Popula os dropdowns ao abrir a baixa
            // Limpa campos para nova baixa
            document.getElementById('inputTipoPapelBaixa').value = '';
            document.getElementById('inputGramaturaBaixa').value = ''; // Novo
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
