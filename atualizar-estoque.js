// Importa os módulos necessários do Node.js
// 'fs' para interagir com o sistema de arquivos (ler e escrever arquivos)
// 'path' para resolver caminhos de arquivos de forma segura e compatível com diferentes sistemas
const fs = require('fs');
const path = require('path');

// Esta é a função principal que a Vercel vai executar
// Toda requisição para a nossa API vai passar por aqui
module.exports = async (req, res) => {
    // 1. Verificar o método da requisição
    // Queremos que esta API só responda a requisições do tipo POST
    // Requisições POST são usadas quando enviamos dados para o servidor (neste caso, dados de entrada/baixa)
    if (req.method !== 'POST') {
        // Se não for POST, enviamos um erro 405 (Método Não Permitido)
        return res.status(405).send('Método não permitido. Use POST.');
    }

    // 2. Definir o caminho para o arquivo CSV
    // '__dirname' é o diretório onde este arquivo 'atualizar-estoque.js' está (ou seja, a pasta 'api')
    // '..' sobe um nível, saindo da pasta 'api' para a raiz do projeto
    // 'Controle_de_Papeis.csv' é o nome do nosso arquivo de dados
    const filePath = path.resolve(__dirname, '..', 'Controle_de_Papeis.csv');

    // 3. Obter os dados enviados pelo frontend
    // Os dados virão no corpo da requisição (req.body)
    // Usamos desestruturação para pegar 'tipo', 'quantidade', e 'data'
    const { tipo, quantidade, data } = req.body;

    // 4. Validação básica dos dados
    // Verificamos se todos os campos necessários foram fornecidos
    if (!tipo || !quantidade || !data) {
        // Se algum campo estiver faltando, enviamos um erro 400 (Requisição Inválida)
        return res.status(400).json({ message: 'Dados incompletos. Forneça tipo, quantidade e data.' });
    }

    // 5. Preparar a nova linha para o CSV
    // Criamos uma string com os dados formatados, seguindo a estrutura do seu CSV
    // Assumimos a ordem: Tipo, Quantidade, Data
    // E adicionamos uma quebra de linha '\n' para a próxima entrada
    const novaLinha = `${tipo},${quantidade},${data}\n`;

    try {
        // 6. Anexar a nova linha ao arquivo CSV
        // 'fs.appendFile' adiciona conteúdo ao final de um arquivo.
        // O terceiro parâmetro (err) é uma função de callback que será executada após a operação.
        await fs.promises.appendFile(filePath, novaLinha, 'utf8');

        // 7. Enviar resposta de sucesso
        // Se tudo ocorrer bem, enviamos um status 200 (OK) e uma mensagem de sucesso
        res.status(200).json({ message: 'Estoque atualizado com sucesso!' });

    } catch (error) {
        // 8. Lidar com erros
        // Se ocorrer algum erro durante a escrita do arquivo, capturamos aqui
        // E enviamos um status 500 (Erro Interno do Servidor) com a mensagem de erro
        console.error('Erro ao atualizar o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao atualizar o estoque.', error: error.message });
    }
};