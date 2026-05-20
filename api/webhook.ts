import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const body = req.body;

  if (body.callback_query) {
    const callbackData = body.callback_query.data;
    const messageId = body.callback_query.message.message_id;
    const chatId = body.callback_query.message.chat.id;
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (callbackData.startsWith('req_off_')) {
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
        
        const webAppUrl = 'https://genset-notifier.vercel.app/telegram-menu?status=Mati';
        
        await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [[
                { text: "📸 Buka Kamera Laporan (Mati)", url: webAppUrl }
              ]]
            }
          }),
        });

        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: `✅ Waktu OK! Silakan ambil foto genset mati!`,
          }),
        });
      }
    }
  }

  res.status(200).send('OK');
}