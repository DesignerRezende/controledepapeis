// api/atualizar-estoque.js

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Método não permitido. Use POST.');
    }

    const filePath = path.resolve(__dirname, '..', 'Controle_de_Papeis.csv');

    const novaLinhaCSV = req.body;

    let fileContent = '';
    let shouldAddHeader = false;

    try {
        if (!fs.existsSync(filePath)) {
            // Se o arquivo não existe, precisamos criar ele com o cabeçalho ATUALIZADO (8 colunas)
            shouldAddHeader = true;
            fileContent = "Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas por Pacote;Total de Folhas;Estoque Mínimo\n";
        } else {
            fileContent = await fs.promises.readFile(filePath, 'utf8');
            // Basicamente, se o arquivo existe e está vazio ou só tem linha de quebra, adicionamos cabeçalho
            if (fileContent.trim() === '') {
                shouldAddHeader = true;
                fileContent = "Tipo de Papel;Gramatura;Marca;Tamanho;Qtd. Pacotes;Folhas por Pacote;Total de Folhas;Estoque Mínimo\n";
            }
        }
        
        const contentToAdd = (fileContent.trim() !== '' && !shouldAddHeader ? '\n' : '') + novaLinhaCSV;
        
        await fs.promises.appendFile(filePath, contentToAdd, 'utf8');

        res.status(200).json({ message: 'Estoque atualizado com sucesso!' });

    } catch (error) {
        console.error('Erro ao atualizar o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao atualizar o estoque.', error: error.message });
    }
};
