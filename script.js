// --- FUNÇÕES AUXILIARES ---

function formatarData(data) {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// --- FUNÇÃO PRINCIPAL PARA ENVIAR DADOS PARA NOSSA API DE ATUALIZAÇÃO ---

async function enviarParaAPI(tipo, quantidade) { // Remover 'data' daqui pois será gerada
    // A data será gerada dentro da função que chama enviarParaAPI
    const dataAtual = new Date();
    const dataFormatada = formatarData(dataAtual);

    // IMPORTANT: Os dados enviados para 'atualizar-estoque.js' devem seguir a ordem das colunas do CSV:
    // Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas
    // No seu caso, 'Tipo' e 'Quantidade' são os principais para Entrada/Baixa
    // Os outros campos serão tratados como vazios na linha adicionada se não forem fornecidos
    // Ou você precisaria de inputs adicionais para Marca, Tamanho etc. para Entrada/Baixa.
    // Por enquanto, vou focar em Tipo, Quantidade e Data, com placeholders para os outros.
    
    // A API de atualização espera dados para formar uma linha CSV.
    // Vamos enviar como texto puro, separado por ';', para facilitar o backend.
    const novaLinhaCSV = `${tipo};;;${quantidade};;${dataFormatada}`; // Tipo;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas (com placeholders)

    try {
        const response = await fetch('/api/atualizar-estoque', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Informamos que estamos enviando texto puro
            },
            body: novaLinhaCSV, // Enviamos a linha CSV como corpo da requisição
        });

        if (response.ok) {
            const resultado = await response.json();
            alert('Sucesso: ' + resultado.message);
            console.log('Dados enviados com sucesso:', resultado);
            carregarEstoque(); // Atualiza a tabela após a operação
        } else {
            const errorText = await response.text(); // Pega a resposta como texto, não JSON
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
            const csvContent = await response.text(); // Recebe o CSV bruto como texto

            const linhas = csvContent.split('\n').filter(line => line.trim() !== '');

            // Assume que a primeira linha são os cabeçalhos
            const headers = linhas.length > 0 ? linhas[0].split(';') : [];
            const dados = linhas.slice(1); // Ignora a linha do cabeçalho para os dados

            if (dados.length === 0 && headers.length === 0) {
                // Caso o CSV esteja completamente vazio (sem cabeçalho e sem dados)
                const row = corpoTabela.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 6; // Ajuste para o número total de colunas da sua tabela
                cell.textContent = 'Nenhum item no estoque ainda.';
                cell.style.textAlign = 'center';
                return;
            } else if (dados.length === 0 && headers.length > 0) {
                 // Caso o CSV tenha cabeçalho mas nenhuma linha de dados
                 const row = corpoTabela.insertRow();
                 const cell = row.insertCell(0);
                 cell.colSpan = headers.length; // Ajuste para o número total de colunas da sua tabela
                 cell.textContent = 'O estoque está vazio. Adicione um item.';
                 cell.style.textAlign = 'center';
                 return;
            }


            // Preenche a tabela com os dados do estoque
            dados.forEach(linha => {
                const colunas = linha.split(';'); // Divide a linha por ponto e vírgula
                const row = corpoTabela.insertRow();

                // Garante que haja células para todas as colunas esperadas
                // Ajuste esta parte se você tiver um número fixo de colunas esperado
                // Ou se quiser mapear por nome de cabeçalho
                // A ordem é: Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas
                
                // Exemplo para suas 6 colunas:
                for (let i = 0; i < 6; i++) { // Iterar pelo número de colunas da sua tabela HTML
                    const cell = row.insertCell(i);
                    cell.textContent = colunas[i] ? colunas[i].trim() : ''; // Pega o valor ou vazio
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
    const inputTipoPapel = document.getElementById('tipoPapelEntrada'); // Novo input para Tipo de Papel
    const inputMarca = document.getElementById('marcaEntrada'); // Novo input para Marca
    const inputTamanho = document.getElementById('tamanhoEntrada'); // Novo input para Tamanho
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const inputFolhasPct = document.getElementById('folhasPctEntrada'); // Novo input para Folhas/Pct
    const inputTotalFolhas = document.getElementById('totalFolhasEntrada'); // Novo input para Total Folhas (calculado ou inserido)

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const marca = inputMarca ? inputMarca.value.trim() : '';
    const tamanho = inputTamanho ? inputTamanho.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);
    const folhasPct = parseFloat(inputFolhasPct.value);
    const totalFolhas = parseFloat(inputTotalFolhas.value); // Se você calcular, remova este input

    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, digite uma quantidade válida de pacotes para a entrada.');
        return;
    }
    
    // Validações adicionais conforme necessário para os outros campos
    if (!tipoPapel) {
        alert('Por favor, digite o Tipo de Papel para a entrada.');
        return;
    }
    // ... adicione mais validações

    // Cria a linha CSV completa para enviar
    const dadosCompletos = `${tipoPapel};${marca};${tamanho};${quantidade};${folhasPct};${totalFolhas}`;
    
    // A função 'enviarParaAPI' foi modificada para receber apenas a linha CSV já formatada
    // Mudei o 'enviarParaAPI' para aceitar uma linha CSV completa para a função de entrada/baixa.
    // É importante que os dados estejam na ordem correta para o CSV.
    enviarParaAPI(dadosCompletos);

    // Limpa os campos após o envio
    if (inputTipoPapel) inputTipoPapel.value = '';
    if (inputMarca) inputMarca.value = '';
    if (inputTamanho) inputTamanho.value = '';
    inputQuantidade.value = '';
    if (inputFolhasPct) inputFolhasPct.value = '';
    if (inputTotalFolhas) inputTotalFolhas.value = '';
}


function registrarBaixa() {
    // Para Baixa, vamos assumir que você apenas insere o Tipo de Papel e a Quantidade a ser baixada.
    // Se precisar de mais campos, adicione inputs correspondentes no HTML e pegue os valores aqui.
    const inputTipoPapel = document.getElementById('tipoPapelBaixa'); // Assumindo que você tem um input para isso
    const inputQuantidade = document.getElementById('quantidadeBaixa');

    const tipoPapel = inputTipoPapel ? inputTipoPapel.value.trim() : '';
    const quantidade = parseFloat(inputQuantidade.value);

    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, digite uma quantidade válida de pacotes para a baixa.');
        return;
    }
    
    if (!tipoPapel) {
        alert('Por favor, digite o Tipo de Papel para a baixa.');
        return;
    }

    // Cria a linha CSV para a baixa. Para a baixa, geralmente só registramos o tipo e a quantidade.
    // Os outros campos serão vazios na linha CSV.
    const dadosCompletos = `${tipoPapel};;;${-quantidade};;`; // -quantidade para indicar baixa

    enviarParaAPI(dadosCompletos);

    if (inputTipoPapel) inputTipoPapel.value = '';
    inputQuantidade.value = '';
}


// --- FUNÇÃO: BAIXAR CSV (JÁ EXISTE, MAS FOI AJUSTADA PARA USAR A NOVA API) ---

async function baixarCSV() {
    try {
        const response = await fetch('/api/ler-estoque'); // Usa a API de leitura que retorna o CSV bruto
        if (response.ok) {
            const csvContent = await response.text(); // Pega o conteúdo como texto
            
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


// --- CONEXÃO DOS BOTÕES E CARREGAMENTO INICIAL ---

document.addEventListener('DOMContentLoaded', () => {
    // Certifique-se de que seus IDs de input são consistentes com o HTML
    // (ex: 'quantidadeEntrada', 'quantidadeBaixa')

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

    // Carrega a tabela assim que a página é carregada
    carregarEstoque();
});
