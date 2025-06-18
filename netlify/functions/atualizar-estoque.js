// netlify/functions/api/atualizar-estoque.js

const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

// CORREÇÃO: Mudar o formato de exportação para o padrão do Netlify Functions
exports.handler = async (event, context) => {
    // O Netlify passa a requisição no 'event.httpMethod' e 'event.body'
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Método não permitido. Use POST.',
        };
    }

    // O corpo da requisição POST vem em event.body
    const novaLinhaCSV = event.body;

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

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Permite que o frontend acesse
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: 'Estoque atualizado com sucesso!' }),
        };

    } catch (error) {
        console.error('Erro ao atualizar o Google Sheets:', error.response ? error.response.data : error);
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*', // Permite que o frontend acesse
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: 'Erro ao atualizar o estoque no Google Sheets.', error: errorMessage }),
        };
    }
};
