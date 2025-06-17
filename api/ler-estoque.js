// api/ler-estoque.js

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Esta API deve responder a requisições GET (para PEGAR dados)
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido. Use GET.');
    }

    const filePath = path.resolve(__dirname, '..', 'Controle_de_Papeis.csv');

    try {
        // Verifica se o arquivo existe antes de tentar ler
        if (!fs.existsSync(filePath)) {
            // Se o arquivo não existir, retornamos um array vazio ou um erro
            // Depende de como queremos lidar com um CSV vazio/inexistente inicialmente
            // Por agora, vamos retornar 200 OK com um array vazio, simulando um estoque sem itens
            return res.status(200).json([]);
        }

        // Lê o conteúdo do arquivo CSV
        const data = await fs.promises.readFile(filePath, 'utf8');

        // Processa o CSV (simplesmente divide por linha e depois por vírgula)
        // Ignora linhas vazias no final
        const linhas = data.split('\n').filter(line => line.trim() !== '');

        // Converte as linhas do CSV em um formato de objetos JavaScript mais fácil de usar
        // Supondo cabeçalhos: Tipo,Quantidade,Data (do seu 'atualizar-estoque.js')
        // Ou o cabeçalho que você tem no seu Controle_de_Papeis.csv
        const estoque = linhas.map(linha => {
            const [tipo, quantidade, data] = linha.split(',');
            return { tipo, quantidade: parseFloat(quantidade), data };
        });

        // Envia o estoque como uma resposta JSON
        res.status(200).json(estoque);

    } catch (error) {
        console.error('Erro ao ler o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao carregar o estoque.', error: error.message });
    }
};