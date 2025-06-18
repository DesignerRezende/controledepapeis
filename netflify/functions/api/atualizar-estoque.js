// netlify/functions/api/atualizar-estoque.js

const { google } = require("googleapis");

// Variáveis de ambiente configuradas no Netlify.
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// A chave privada vem da variável de ambiente codificada em Base64, e é decodificada aqui.
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Método não permitido. Use POST.');
    }

    const novaLinhaCSV = req.body;

    try {
        const auth = new google.auth.JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const checkRange = 'A1:A1';
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: checkRange,
        });

        const hasHeader = existingData.data.values && existingData.data.values.length > 0 && existingData.data.values[0][0].trim() !== '';

        let valuesToAppend = [];
        if (!hasHeader) {
            valuesToAppend.push(["Tipo de Papel", "Gramatura", "Marca", "Tamanho", "Qtd. Pacotes", "Folhas por Pacote", "Total de Folhas", "Estoque Mínimo"]);
        }

        valuesToAppend.push(novaLinhaCSV.split(';'));

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'A:H',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: valuesToAppend,
            },
        });

        res.status(200).json({ message: 'Estoque atualizado com sucesso no Google Sheets!' });

    } catch (error) {
        console.error('Erro ao atualizar o Google Sheets:', error.response ? error.response.data : error);
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ message: 'Erro ao atualizar o estoque no Google Sheets.', error: errorMessage });
    }
};
