import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const appendToSheet = async (staffName: string, status: string, time: string, userId: string) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    const checkHeader = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:D1',
    });

    const headerData = checkHeader.data.values;
    if (!headerData || headerData.length === 0 || !headerData[0][0]?.toLowerCase().includes('waktu')) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Waktu', 'Nama Staf', 'Status', 'User ID']],
        },
      });
      console.log("Header berhasil dibuat!");
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:D', 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[time, staffName, status, userId]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error writing to sheets:', error);
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const body = req.body;

  if (body.callback_query) {
    const callbackData = body.callback_query.data;
    const staffName = body.callback_query.from.first_name || 'Staf';
    const userId = String(body.callback_query.from.id);
    const messageId = body.callback_query.message.message_id;
    const chatId = body.callback_query.message.chat.id;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    if (callbackData === 'genset_on') {
      await appendToSheet(staffName, 'Menyala', now, userId);

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Jenset **DINYALAKAN** oleh ${staffName} pada ${now}\n\n⚠️ Jangan lupa klik tombol di bawah jika sudah dimatikan!`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "🔴 Sudah Dimatikan", callback_data: "genset_off" }]]
          }
        }),
      });
    } else if (callbackData === 'genset_off') {
      await appendToSheet(staffName, 'Mati', now, userId);

      const oldText = body.callback_query.message.text.replace('⚠️ Jangan lupa klik tombol di bawah jika sudah dimatikan!', '');

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${oldText}\n🔴 Jenset **DIMATIKAN** oleh ${staffName} pada ${now}`,
          parse_mode: 'Markdown'
        }),
      });
    }
  }

  res.status(200).send('OK');
}