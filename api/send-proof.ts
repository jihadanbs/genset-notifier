import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  const { staffName, status, address, photoUrl, msgId } = req.body;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;

  const timeString = new Date().toLocaleString('id-ID', { 
    timeZone: 'Asia/Jakarta', 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\./g, ':');

  const caption = `✅ **LAPORAN GENSET MASUK** ✅\n\n👷 Operator: **${staffName}**\n⚙️ Aksi: **${status.toUpperCase()}**\n⏱️ Waktu: **${timeString}**\n📍 Lokasi: **${address || 'Lokasi tidak terdeteksi'}**\n\n_Laporan diverifikasi oleh sistem GPS & Kamera._`;

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

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (msgId) {
      if (status.toLowerCase() === 'menyala') {
        await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: msgId })
        });
      } else {
        await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: msgId,
            reply_markup: { inline_keyboard: [] }
          })
        });

        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: lastOnLog } = await supabase
            .from('genset_logs')
            .select('warning_message_id')
            .eq('status', 'Menyala')
            .not('warning_message_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastOnLog && lastOnLog.warning_message_id) {
            await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                chat_id: chatId, 
                message_id: lastOnLog.warning_message_id 
              })
            });
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
}