"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendToSheet = void 0;
const googleapis_1 = require("googleapis");
const appendToSheet = async (staffName, status, time) => {
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[time, staffName, status]],
            },
        });
        return true;
    }
    catch (error) {
        console.error('Error writing to sheets:', error);
        return false;
    }
};
exports.appendToSheet = appendToSheet;
