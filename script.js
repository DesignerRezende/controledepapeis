// --- FUNÇÕES AUXILIARES (APENAS PARA O NOSSO CASO) ---

// Função para formatar a data (dia/mês/ano)
function formatarData(data) {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexed
    const ano = d.getFullYear();
    return `<span class="math-inline">\{dia\}/</span>{mes}/${ano}`;
}

// --- FUNÇÃO PRINCIPAL PARA ENVIAR DADOS PARA NOSSA API ---

async function enviarParaAPI(tipo, quantidade, data) {
    // Objeto com os dados que vamos enviar para o servidor
    const dadosParaEnviar = {
        tipo: tipo,
        quantidade: quantidade,
        data: data
    };

    try {
        // Usa a função 'fetch' para fazer uma requisição para a nossa API
        // O caminho '/api/atualizar-estoque' é o endereço da nossa função no Vercel
        const response = await fetch('/api/atualizar-estoque', {
            method: 'POST', // Dizemos que estamos ENVIANDO dados (POST)
            headers: {
                'Content-Type': 'application/json', // Dizemos que os dados são em formato JSON
            },
            body: JSON.stringify(dadosParaEnviar), // Transforma o objeto JavaScript em texto JSON
        });

        // Verifica se a resposta do servidor foi boa (código 200, 201, etc.)
        if (response.ok) {
            const resultado = await response.json(); // Transforma a resposta do servidor em objeto JavaScript
            alert('Sucesso: ' + resultado.message); // Mostra a mensagem de sucesso para o usuário
            console.log('Dados enviados com sucesso:', resultado);

            // Opcional: Se quiser que a página recarregue após o sucesso (para simular uma atualização)
            // window.location.reload();

        } else {
            // Se a resposta do servidor não foi boa (ex: erro 400, 500)
            const erroDados = await response.json(); // Pega a mensagem de erro
            alert('Erro: ' + erroDados.message); // Mostra a mensagem de erro para o usuário
            console.error('Erro ao enviar dados para a API:', erroDados);
        }
    } catch (erro) {
        // Se houver um problema de conexão ou algo inesperado
        alert('Ocorreu um erro de conexão. Verifique sua internet ou tente novamente.');
        console.error('Erro na requisição fetch:', erro);
    }
}

// --- FUNÇÕES DE ENTRADA/SAÍDA (QUE OS BOTÕES CHAMAM) ---

// Função para registrar uma Entrada de material
function registrarEntrada() {
    const inputQuantidade = document.getElementById('quantidadeEntrada');
    const quantidade = parseFloat(inputQuantidade.value); // Pega o número digitado

    // Validação simples
    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, digite uma quantidade válida para a entrada.');
        return; // Sai da função se a quantidade for inválida
    }

    const dataAtual = new Date(); // Pega a data e hora de agora
    const dataFormatada = formatarData(dataAtual); // Formata a data para o CSV

    // Chama a função que envia os dados para a nossa API
    enviarParaAPI('Entrada', quantidade, dataFormatada);

    inputQuantidade.value = ''; // Limpa o campo de quantidade
}

// Função para registrar uma Baixa de material
function registrarBaixa() {
    const inputQuantidade = document.getElementById('quantidadeBaixa');
    const quantidade = parseFloat(inputQuantidade.value); // Pega o número digitado

    // Validação simples
    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, digite uma quantidade válida para a baixa.');
        return; // Sai da função se a quantidade for inválida
    }

    const dataAtual = new Date(); // Pega a data e hora de agora
    const dataFormatada = formatarData(dataAtual); // Formata a data para o CSV

    // Chama a função que envia os dados para a nossa API
    enviarParaAPI('Baixa', quantidade, dataFormatada);

    inputQuantidade.value = ''; // Limpa o campo de quantidade
}

// --- CONEXÃO DOS BOTÕES COM AS FUNÇÕES (Garanta que isso exista) ---

// Este código garante que, quando os botões forem clicados, as funções acima serão chamadas.
// Se você já tem algo parecido no seu script.js, mantenha ou substitua.
document.addEventListener('DOMContentLoaded', () => {
    const btnEntrada = document.getElementById('btnEntrada');
    const btnBaixa = document.getElementById('btnBaixa');

    if (btnEntrada) {
        btnEntrada.addEventListener('click', registrarEntrada);
    }
    if (btnBaixa) {
        btnBaixa.addEventListener('click', registrarBaixa);
    }
});
