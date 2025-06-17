// api/ler-estoque.js

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido. Use GET.');
    }

    const filePath = path.resolve(__dirname, '..', 'Controle_de_Papeis.csv');

    try {
        if (!fs.existsSync(filePath)) {
            // Se o arquivo não existir ou estiver vazio, retorna os cabeçalhos para o frontend
            // e uma linha indicando que não há dados ainda
            const headers = "Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas";
            // Retorna o cabeçalho e nenhuma linha de dados (ou uma linha de exemplo se preferir)
            return res.status(200).send(headers + '\n'); // Enviando o cabeçalho como texto puro
        }

        const data = await fs.promises.readFile(filePath, 'utf8');

        // Retorna o conteúdo RAW (bruto) do CSV
        // O frontend que irá parsear e exibir, ou o usuário baixará.
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(data);

    } catch (error) {
        console.error('Erro ao ler o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao carregar o estoque.', error: error.message });
    }
};
