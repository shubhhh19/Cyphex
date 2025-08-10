import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
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
    const body = JSON.parse(rawBody || '{}');
    email = body.email;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON', details: e.message });
    return;
  }

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const config = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000
    };

    // Prefer detailed analytics endpoint
    const { data } = await axios.get(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      config
    );

    const breachesDetails = data?.ExposedBreaches?.breaches_details;
    const metricsRiskScore = data?.BreachMetrics?.risk?.[0]?.risk_score;

    if (Array.isArray(breachesDetails) && breachesDetails.length > 0) {
      const breachDetails = breachesDetails.map((b) => {
        // Support both snake_case (breach-analytics) and camelCase (breaches) shapes
        const name = b.breach || b.Name || b.Title || 'Unknown Breach';
        const date = b.xposed_date || b.breachedDate || 'Unknown';
        const description = b.details || b.exposureDescription || '';
        const domain = b.domain || 'Unknown';
        const industry = b.industry || 'Unknown';
        const affectedAccounts = b.xposed_records || b.exposedRecords || 0;
        const passwordRisk = b.password_risk || b.passwordRisk || 'Unknown';

        let dataTypes = [];
        if (typeof b.xposed_data === 'string') {
          dataTypes = b.xposed_data.split(';').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(b.exposedData)) {
          dataTypes = b.exposedData;
        }
        if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
          dataTypes = ['Email addresses'];
        }

        return {
          name,
          date,
          description,
          dataTypes,
          affectedAccounts,
          domain,
          industry,
          passwordRisk
        };
      });

      const breachScore = Number.isFinite(metricsRiskScore)
        ? Math.max(0, Math.min(100, Math.round(metricsRiskScore)))
        : Math.min(breachDetails.length * 10, 100);

      const threatProfileSummary =
        breachScore < 25 ? 'Low risk. Few breaches detected.' :
        breachScore < 50 ? 'Medium risk. Multiple breaches detected.' :
        breachScore < 75 ? 'High risk. Many breaches detected.' :
        'Critical risk. Extensive breach exposure.';

      res.status(200).json({
        breachScore,
        threatProfileSummary,
        breachDetails,
        analytics: data || null
      });
      return;
    }

    // If analytics failed or found nothing, try the lightweight check for names
    const fallback = await axios.get(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
      config
    ).then(r => r.data).catch(() => null);

    if (fallback && fallback.breaches && Array.isArray(fallback.breaches[0]) && fallback.breaches[0].length > 0) {
      const names = fallback.breaches[0];
      const breachDetails = names.map((name) => ({
        name: name || 'Unknown Breach',
        date: 'Unknown',
        description: `Email found in ${name} breach`,
        dataTypes: ['Email addresses'],
        affectedAccounts: 0,
        domain: 'Unknown',
        industry: 'Unknown',
        passwordRisk: 'Unknown'
      }));

      const breachScore = Math.min(breachDetails.length * 10, 100);
      const threatProfileSummary =
        breachScore < 25 ? 'Low risk. Few breaches detected.' :
        breachScore < 50 ? 'Medium risk. Multiple breaches detected.' :
        breachScore < 75 ? 'High risk. Many breaches detected.' :
        'Critical risk. Extensive breach exposure.';

      res.status(200).json({
        breachScore,
        threatProfileSummary,
        breachDetails,
        analytics: fallback || null
      });
      return;
    }

    // No breaches
    res.status(200).json({
      breachScore: 0,
      threatProfileSummary: 'No breaches found. Your email appears to be secure.',
      breachDetails: []
    });
  } catch (error) {
    const message = error?.response?.status
      ? `Upstream API error: ${error.response.status}`
      : error.message || 'Unknown error';
    res.status(500).json({ error: 'Internal server error', details: message });
  }
} 