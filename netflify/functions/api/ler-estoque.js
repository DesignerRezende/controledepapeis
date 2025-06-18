// netlify/functions/api/ler-estoque.js

const { google } = require("googleapis");

// Variáveis de ambiente configuradas no Netlify.
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// A chave privada vem da variável de ambiente codificada em Base64, e é decodificada aqui.
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido. Use GET.');
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

        if (!values || values.length === 0) {
            const headers = ["Tipo de Papel", "Gramatura", "Marca", "Tamanho", "Qtd. Pacotes", "Folhas por Pacote", "Total de Folhas", "Estoque Mínimo"];
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            return res.status(200).send(headers.join(';') + '\n');
        }

        const headers = values[0];
        const dataRows = values.slice(1);

        let csvContent = headers.join(';') + '\n';
        dataRows.forEach(row => {
            const fullRow = Array(headers.length).fill('');
            row.forEach((value, index) => {
                fullRow[index] = value;
            });
            csvContent += fullRow.join(';') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Erro ao ler do Google Sheets:', error);
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ message: 'Erro ao carregar o estoque do Google Sheets.', error: errorMessage });
    }
};
