// netlify/functions/api/ler-estoque.js

const { google } = require("googleapis");

// Variáveis de ambiente configuradas no Netlify.
// Lemos o ID da planilha, o email da conta de serviço e a chave privada (decodificada de Base64).
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

module.exports = async (req, res) => {
    // Garante que apenas requisições GET sejam processadas.
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido. Use GET.');
    }

    try {
        // Autenticação com a conta de serviço do Google
        // Usamos as variáveis de ambiente decodificadas.
        const auth = new google.auth.JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Permissão apenas de leitura da planilha
        });

        // Inicializa a API do Google Sheets
        const sheets = google.sheets({ version: 'v4', auth });

        // Define o intervalo de leitura na planilha (colunas A até H)
        const range = 'A:H';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        const values = response.data.values; // Dados lidos da planilha

        // Se a planilha estiver vazia, retorna apenas o cabeçalho
        if (!values || values.length === 0) {
            const headers = ["Tipo de Papel", "Gramatura", "Marca", "Tamanho", "Qtd. Pacotes", "Folhas por Pacote", "Total de Folhas", "Estoque Mínimo"];
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            return res.status(200).send(headers.join(';') + '\n');
        }

        const headers = values[0]; // A primeira linha da planilha são os cabeçalhos
        const dataRows = values.slice(1); // As demais linhas são os dados

        // Converte os dados para o formato CSV (separado por ';') para enviar ao frontend
        let csvContent = headers.join(';') + '\n'; // Adiciona o cabeçalho

        dataRows.forEach(row => {
            // Garante que cada linha tenha o número correto de colunas (preenche com vazio se faltar)
            const fullRow = Array(headers.length).fill('');
            row.forEach((value, index) => {
                fullRow[index] = value;
            });
            csvContent += fullRow.join(';') + '\n';
        });

        // Envia o conteúdo CSV como resposta para o frontend
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Erro ao ler do Google Sheets:', error);
        // Captura mensagens de erro mais detalhadas da API do Google para depuração
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ message: 'Erro ao carregar o estoque do Google Sheets.', error: errorMessage });
    }
};
