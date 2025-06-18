// netlify/functions/ler-estoque.js

const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

// CORREÇÃO: Mudar o formato de exportação para o padrão do Netlify Functions
exports.handler = async (event, context) => {
    // O Netlify passa a requisição no 'event.httpMethod' e 'event.body'
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Método não permitido. Use GET.',
        };
    }

    try {
        const auth = new google.auth.JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const range = 'A:H';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        const values = response.data.values;

        let csvContent = '';
        if (!values || values.length === 0) {
            // Retorna apenas o cabeçalho se a planilha estiver vazia
            const headers = ["Tipo de Papel", "Gramatura", "Marca", "Tamanho", "Qtd. Pacotes", "Folhas por Pacote", "Total de Folhas", "Estoque Mínimo"];
            csvContent = headers.join(';') + '\n';
        } else {
            const headers = values[0];
            const dataRows = values.slice(1);

            csvContent = headers.join(';') + '\n';
            dataRows.forEach(row => {
                const fullRow = Array(headers.length).fill('');
                row.forEach((value, index) => {
                    fullRow[index] = value;
                });
                csvContent += fullRow.join(';') + '\n';
            });
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Access-Control-Allow-Origin': '*', // Permite que o frontend acesse
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: csvContent,
        };

    } catch (error) {
        console.error('Erro ao ler do Google Sheets:', error);
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*', // Permite que o frontend acesse
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ message: 'Erro ao carregar o estoque do Google Sheets.', error: errorMessage }),
        };
    }
};
