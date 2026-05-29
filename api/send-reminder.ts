import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { userId, name } = req.body; 
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const GROUP_ID = process.env.TELEGRAM_GROUP_ID;
    if (!BOT_TOKEN) throw new Error('Bot token not found in environment variables');
    if (!GROUP_ID) throw new Error('Group ID not found in environment variables');

    const message = `⚠️ *NGINGETIN BOSS* ⚠️\n\nHalo [${name}](tg://user?id=${userId}), kamu diminta oleh BOS BOS untuk segera mengecek dan mengoperasikan Genset Klabat sekarang!`;
    const baseUrl = 'https://genset-notifier.vercel.app/telegram-menu';

    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: "🟢 Lapor NYALA", 
            url: `${baseUrl}?status=Menyala&operator=${encodeURIComponent(name)}`
          },
          { 
            text: "🔴 Lapor MATI", 
            url: `${baseUrl}?status=Mati&operator=${encodeURIComponent(name)}`
          }
        ]
      ]
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: GROUP_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    const data = await tgRes.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send message via Telegram');
    }

    return res.status(200).json({ success: true });

  } catch (error: unknown) {
    console.error('Error send-reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ success: false, error: errorMessage });
  }
}