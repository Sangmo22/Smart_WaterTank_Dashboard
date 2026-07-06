import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // Set CORS headers for local/cross-origin testing if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sourceLevel } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'Your App <onboarding@resend.dev>',
      to: [process.env.ALERT_EMAIL || 'sangmolama29@gmail.com'],
      subject: 'Water Tank Alert: Source Low',
      text: `Source tank level is low: ${sourceLevel}%`,
      html: `<p>Source tank level is low: <strong>${sourceLevel}%</strong></p>`,
    });

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
