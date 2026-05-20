import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;
  const webAppUrl = 'https://genset-notifier.vercel.app/telegram-menu?status=Menyala';
  
  const text = "🚨 **REMINDER GENSET** 🚨\nHALOOO BASUDEWA, sudah waktunya menyalakan genset. Tolong klik tombol di bawah jika genset sudah menyala!";

  const replyMarkup = {
    inline_keyboard: [[
      { text: "📸 Buka Kamera Laporan", url: webAppUrl }
    ]]
  };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      }),
    });

    const telegramData = await response.json();

    if (!telegramData.ok) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rejected by Telegram API', 
        details: telegramData.description
      });
    }
    
    res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error(error);

    res.status(500).json({
        success: false,
        error: 'Failed to send telegram message'
    });
  }
}