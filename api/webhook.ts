import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appendToSheet } from './lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const body = req.body;

  if (body.callback_query) {
    const callbackData = body.callback_query.data;
    const staffName = body.callback_query.from.first_name || 'Staf';
    const messageId = body.callback_query.message.message_id;
    const chatId = body.callback_query.message.chat.id;

    if (callbackData === 'genset_on') {
      const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      
      await appendToSheet(staffName, 'Menyala', now);

      const token = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Jenset telah dinyalakan oleh **${staffName}** pada ${now}`,
          parse_mode: 'Markdown'
        }),
      });
    }
  }

  res.status(200).send('OK');
}