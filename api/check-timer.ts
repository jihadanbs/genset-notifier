import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { data: latestLog, error } = await supabase
      .from('genset_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !latestLog || latestLog.length === 0) {
      return res.status(200).json({ message: 'Belum ada data log di database.' });
    }

    const log = latestLog[0];

    if (log.status.toLowerCase() === 'mati') {
      return res.status(200).json({ message: 'Genset aman, posisi saat ini OFF.' });
    }

    if (log.status.toLowerCase() === 'menyala' && !log.reminder_sent) {
      const turnOnTime = new Date(log.created_at).getTime();
      const now = Date.now();
      
      const elapsedMinutes = (now - turnOnTime) / (1000 * 60);

      if (elapsedMinutes >= 30) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_GROUP_ID;

        const alertText = `🚨 **PERINGATAN: WAKTU HABIS!** 🚨\n\nINFO BOS: Genset saat ini sudah menyala selama **${Math.floor(elapsedMinutes)} menit**!\n\n👷 Operator terakhir: **${log.operator_name}**\n\nMohon untuk segera mematikan genset melalui tombol **🔴 Request Matikan Genset** di pesan atas dan upload foto bukti!`;

        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: alertText,
            parse_mode: 'Markdown'
          }),
        });

        const tgData = await tgRes.json();
        const warningMsgId = tgData.ok ? tgData.result.message_id : null;

        await supabase
          .from('genset_logs')
          .update({ 
            reminder_sent: true, 
            warning_message_id: warningMsgId
          })
          .eq('id', log.id);

        return res.status(200).json({ message: 'Notifikasi peringatan dikirim & ID disimpan!' });
      }
    }

    return res.status(200).json({ message: 'Genset sedang menyala, namun belum mencapai 30 menit!' });

  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({ error: (err as Error).message });
  }
}