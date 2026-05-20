import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;
  
  const text = "🚨 **REMINDER GENSET** 🚨\n\nHALOOO TIM, sudah waktunya menyalakan genset. Siapa yang bertugas? Klik konfirmasi di bawah!";

  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Konfirmasi Menyala", callback_data: "genset_on" }
    ]]
  };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      }),
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Telegram API error:', error);
    res.status(500).json({ success: false });
  }
}