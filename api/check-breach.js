console.log('check-breach handler loaded');
import axios from 'axios';

export default async function handler(req, res) {
  console.log('check-breach handler called');
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS method received, ending');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Non-POST method received:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let email;
  let rawBody = '';
  try {
    await new Promise((resolve, reject) => {
      req.on('data', chunk => { rawBody += chunk; });
      req.on('end', resolve);
      req.on('error', reject);
    });
    const body = JSON.parse(rawBody);
    email = body.email;
  } catch (e) {
    console.log('Invalid JSON received:', e.message);
    res.status(400).json({ error: 'Invalid JSON', details: e.message });
    return;
  }

  if (!email) {
    console.log('No email provided');
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const response = await axios.get(`https://leakcheck.io/api/public?check=${encodeURIComponent(email)}&type=email`);
    const data = response.data;
    console.log('LeakCheck API response:', data);
    if (data.success && data.found && Array.isArray(data.sources) && data.sources.length > 0) {
      const breachScore = Math.min(data.sources.length * 10, 90);
      res.status(200).json({
        breachScore,
        threatProfileSummary: breachScore === 0
          ? "No breaches found. Your email appears to be secure."
          : "Medium risk. Multiple breaches detected.",
        breachDetails: data.sources.map(source => ({
          name: source.source || 'Unknown Source',
          date: 'Unknown',
          description: source.line || '',
          dataTypes: ['Email addresses', 'Passwords'],
          affectedAccounts: 0,
          domain: 'Unknown',
          industry: 'Unknown',
          passwordRisk: 'Unknown'
        }))
      });
    } else {
      console.log('No breaches found or sources array empty');
      res.status(200).json({
        breachScore: 0,
        threatProfileSummary: "No breaches found. Your email appears to be secure.",
        breachDetails: []
      });
    }
  } catch (error) {
    console.log('Error calling LeakCheck API:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 