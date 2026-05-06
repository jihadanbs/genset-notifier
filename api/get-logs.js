"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const googleapis_1 = require("googleapis");
async function handler(req, res) {
    if (req.method !== 'GET')
        return res.status(405).send('Method Not Allowed');
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:C',
        });
        const rows = response.data.values || [];
        const logs = rows.map((row, index) => ({
            id: index,
            time: row[0] || '-',
            name: row[1] || '-',
            status: row[2] || '-'
        })).reverse();
        res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
}
