// api/ler-estoque.js

const { google } = require("googleapis");
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivo - ADICIONADO AQUI!
const credentials = require(path.resolve(__dirname, '../gerenciador-estoque-vercel-235b0a581d9d.json')); // Carrega o JSON de credenciais

// A variável de ambiente SPREADSHEET_ID continua sendo necessária
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Método não permitido. Use GET.');
    }

    try {
        // Autenticação com a conta de serviço do Google
        // AGORA USAMOS DIRETAMENTE AS INFORMAÇÕES DO JSON CARREGADO:
        const auth = new google.auth.JWT({
            email: credentials.client_email, // Pega o e-mail do JSON
            key: credentials.private_key,    // Pega a chave privada do JSON
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Apenas leitura da planilha
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

        const headers = values[0]; // A primeira linha são os cabeçalhos
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

        // Envia o conteúdo CSV como resposta
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Erro ao ler do Google Sheets:', error);
        // Captura mensagens de erro mais detalhadas da API do Google para depuração
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ message: 'Erro ao carregar o estoque do Google Sheets.', error: errorMessage });
    }
};
