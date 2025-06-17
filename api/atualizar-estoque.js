// api/atualizar-estoque.js

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Método não permitido. Use POST.');
    }

    const filePath = path.resolve(__dirname, '..', 'Controle_de_Papeis.csv');

    // Os dados são esperados como texto puro (a linha CSV completa)
    const novaLinhaCSV = req.body; // req.body conterá a linha como string

    // 1. Verificar se o arquivo CSV já tem cabeçalho
    let fileContent = '';
    let shouldAddHeader = false;

    try {
        if (!fs.existsSync(filePath)) {
            // Se o arquivo não existe, precisamos criar ele com o cabeçalho
            shouldAddHeader = true;
            fileContent = "Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas\n";
        } else {
            fileContent = await fs.promises.readFile(filePath, 'utf8');
            // Basicamente, se o arquivo existe e está vazio ou só tem linha de quebra, adicionamos cabeçalho
            if (fileContent.trim() === '') {
                shouldAddHeader = true;
                fileContent = "Tipo de Papel;Marca;Tamanho;Qtd. Pacotes;Folhas/Pct.;Total Folhas\n";
            }
        }
        
        // 2. Anexar a nova linha. Adiciona uma quebra de linha ANTES da nova linha,
        // para garantir que cada entrada fique em uma nova linha, exceto a primeira.
        // Se já tiver conteúdo e não for apenas cabeçalho, adiciona '\n' antes.
        const contentToAdd = (fileContent.trim() !== '' && !shouldAddHeader ? '\n' : '') + novaLinhaCSV;
        
        // Se estamos adicionando o cabeçalho, o 'appendFile' vai criar o arquivo e adicionar o cabeçalho + a primeira linha.
        // Se já existe, ele só anexa.
        await fs.promises.appendFile(filePath, contentToAdd, 'utf8');

        res.status(200).json({ message: 'Estoque atualizado com sucesso!' });

    } catch (error) {
        console.error('Erro ao atualizar o arquivo CSV:', error);
        res.status(500).json({ message: 'Erro ao atualizar o estoque.', error: error.message });
    }
};
