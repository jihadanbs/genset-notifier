import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;
  
  const audioUrl = 'https://genset-notifier.vercel.app/your-phone-lingoging.mp3';
  const caption = "🚨 **REMINDER JENSET** 🚨\nHALOOO BASUDEWA, sudah waktunya menyalakan genset. Tolong klik tombol di bawah jika jenset sudah menyala!";

  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Sudah Dinyalakan", callback_data: "genset_on" }
    ]]
  };

  const url = `https://api.telegram.org/bot${token}/sendAudio`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        audio: audioUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      }),
    });
    
    res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error(error);

    res.status(500).json({
        success: false,
        error: 'Failed to send telegram message'
    });
  }
}