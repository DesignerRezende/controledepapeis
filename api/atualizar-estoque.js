// api/atualizar-estoque.js

const { google } = require("googleapis");

// As variáveis de ambiente (process.env.NOME) serão configuradas na Vercel.
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; 
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL; 
// A chave privada agora virá em Base64 da variável de ambiente e será decodificada para UTF-8.
const GOOGLE_PRIVATE_KEY = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Método não permitido. Use POST.');
    }

    const novaLinhaCSV = req.body; // A linha CSV completa é enviada como string pelo frontend

    try {
        // Autenticação com a conta de serviço do Google
        const auth = new google.auth.JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
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

