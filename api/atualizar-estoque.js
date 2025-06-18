// api/atualizar-estoque.js

const { google } = require("googleapis");
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivo
const credentials = require(path.resolve(__dirname, '../gerenciador-estoque-vercel-235b0a581d9d.json')); // Carrega o JSON de credenciais

// A variável de ambiente SPREADSHEET_ID continua sendo necessária
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Método não permitido. Use POST.');
    }
    const novaLinhaCSV = req.body; // A linha CSV completa é enviada como string pelo frontend

    try {
        // Autenticação com a conta de serviço do Google
        // AGORA USAMOS DIRETAMENTE AS INFORMAÇÕES DO JSON CARREGADO:
        const auth = new google.auth.JWT({
            email: credentials.client_email, // Pega o e-mail do JSON
            key: credentials.private_key,    // Pega a chave privada do JSON
            scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Permissão de leitura e escrita
        });

        // Inicializa a API do Google Sheets
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Verificar se a planilha está vazia (primeira célula A1) para adicionar o cabeçalho
        const checkRange = 'A1:A1';
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: checkRange,
        });

        // Verifica se a célula A1 está vazia para determinar se o cabeçalho precisa ser adicionado
        const hasHeader = existingData.data.values && existingData.data.values.length > 0 && existingData.data.values[0][0].trim() !== '';

        let valuesToAppend = [];
        // Se a planilha estiver vazia (ou A1 estiver vazio), adiciona o cabeçalho na primeira linha
        if (!hasHeader) {
            valuesToAppend.push(["Tipo de Papel", "Gramatura", "Marca", "Tamanho", "Qtd. Pacotes", "Folhas por Pacote", "Total de Folhas", "Estoque Mínimo"]);
        }

        // Adiciona a nova linha de dados (dividida por ';') à lista de valores para anexar
        valuesToAppend.push(novaLinhaCSV.split(';'));

        // Adiciona os dados à planilha
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'A:H', // Define o intervalo onde os dados serão anexados (colunas A a H)
            valueInputOption: 'USER_ENTERED', // Formata como o usuário digitaria (mantém tipos como número)
            resource: {
                values: valuesToAppend,
            },
        });

        res.status(200).json({ message: 'Estoque atualizado com sucesso no Google Sheets!' });

    } catch (error) {
        console.error('Erro ao atualizar o Google Sheets:', error.response ? error.response.data : error);
        // Captura mensagens de erro mais detalhadas da API do Google para depuração
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ message: 'Erro ao atualizar o estoque no Google Sheets.', error: errorMessage });
    }
};
