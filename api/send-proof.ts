import type { VercelRequest, VercelResponse } from '@vercel/node';

type TelegramPayload = {
  chat_id: string | undefined;
  photo: string;
  caption: string;
  parse_mode: string;
  reply_markup?: {
    inline_keyboard: { text: string; callback_data?: string; url?: string }[][];
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { staffName, status, distance, photoUrl } = req.body;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;

  const caption = `✅ **LAPORAN GENSET MASUK** ✅\n\n👷 Operator: **${staffName}**\n⚙️ Aksi: **${status.toUpperCase()}**\n📍 Jarak Validasi: **${distance} meter**\n\n_Laporan diverifikasi oleh sistem GPS & Kamera._`;

  const payload: TelegramPayload = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'Markdown'
  };

  if (status.toLowerCase() === 'menyala') {
    const turnOnTimeMs = Date.now();
    
    payload.reply_markup = {
      inline_keyboard: [[
        { text: "🔴 Request Matikan Genset", callback_data: `req_off_${turnOnTimeMs}` }
      ]]
    };
  }

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram Error:", data);
      return res.status(400).json({ success: false, error: data.description });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
}