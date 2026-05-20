import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!userId || !token) {
    return res.status(400).send('Missing query parameters');
  }

  try {
    const photoRes = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const photoJson = await photoRes.json();

    if (!photoJson.ok || photoJson.result.total_count === 0) {
      return res.status(404).send('No profile photo found');
    }

    const fileId = photoJson.result.photos[0][0].file_id;

    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileJson = await fileRes.json();

    if (!fileJson.ok || !fileJson.result.file_path) {
      return res.status(404).send('File path not found');
    }

    const filePath = fileJson.result.file_path;

    const imageRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    
    if (!imageRes.ok) return res.status(404).send('Error loading image binary');

    const buffer = await imageRes.arrayBuffer();

    res.setHeader('Content-Type', imageRes.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 hari biar hemat api
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error fetching Telegram Avatar:', error);
    return res.status(500).send('Internal Server Error');
  }
}