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
    const currentText = body.callback_query.message.text || ''; 
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    if (callbackData === 'genset_on') {
      if (currentText.includes('DINYALAKAN')) {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: `⚠️ Udah diproses bos! Sabar ya, nggak usah di-spam.`,
          }),
        });
        return res.status(200).send('OK');
      }

      const turnOnTimeMs = Date.now();
      await appendToSheet(staffName, 'Menyala', now, userId);

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Genset **DINYALAKAN** oleh ${staffName} pada ${now}\n\n⏳ *Genset baru boleh dimatikan setelah 30 menit operasional!*`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "🔴 Sudah Dimatikan", callback_data: `genset_off_${turnOnTimeMs}` }]]
          }
        }),
      });
      
    } else if (callbackData.startsWith('genset_off')) {
      if (currentText.includes('DIMATIKAN')) {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: `⚠️ Genset udah dimatikan, nggak perlu dipencet lagi!`,
          }),
        });
        return res.status(200).send('OK');
      }

      const parts = callbackData.split('_');
      
      if (parts.length === 3) {
        const turnOnTimeMs = parseInt(parts[2], 10);
        const elapsedMs = Date.now() - turnOnTimeMs;
        const thirtyMinsMs = 30 * 60 * 1000;

        if (elapsedMs < thirtyMinsMs) {
          const timeLeftMins = Math.ceil((thirtyMinsMs - elapsedMs) / 60000);
          
          await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: `⏳ BELUM 30 MENIT!\n\nGenset baru menyala selama ${Math.floor(elapsedMs / 60000)} menit. Tunggu ${timeLeftMins} menit lagi untuk mematikan!`,
              show_alert: true
            }),
          });
          
          return res.status(200).send('OK');
        }
      }

      await appendToSheet(staffName, 'Mati', now, userId);
      const oldText = currentText.replace('\n\n⏳ *Genset baru boleh dimatikan setelah 30 menit operasional!*', '');

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${oldText}\n\n🔴 Genset **DIMATIKAN** oleh ${staffName} pada ${now}`,
          parse_mode: 'Markdown'
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: `✅ Berhasil dimatikan!`,
        }),
      });
    }
  }

  res.status(200).send('OK');
}