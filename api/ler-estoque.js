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
            const headers = "Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas";
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            return res.status(200).send(headers + '\n');
        }

        const data = await fs.promises.readFile(filePath, 'utf8');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(data);

    } catch (error) {
        console.error('Erro ao ler o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao carregar o estoque.', error: error.message });
    }
};
