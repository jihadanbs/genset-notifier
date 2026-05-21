import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const { data, error } = await supabase
      .from('genset_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const logs = data.map((row) => {
      const timeString = new Date(row.created_at).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).replace(/\./g, ':');

      return {
        id: row.id,
        time: timeString,
        name: row.operator_name || '-',
        status: row.status || '-',
        userId: row.telegram_user_id || '',
        photoUrl: row.photo_url || '',
        lat: row.latitude || '',
        lng: row.longitude || '',
      };
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching logs from Supabase:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
}