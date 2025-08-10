import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Fallback function using HaveIBeenPwned API
async function getBreachAnalyticsHIBP(email) {
    try {
        const config = {
            headers: {
                'User-Agent': 'Cyphex-Email-Scanner',
                'Accept': 'application/json'
            },
            timeout: 10000
        };
        
        const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, config);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const breaches = response.data.map(breach => breach.Name || breach.Title || 'Unknown');
            return { breaches };
        }
        
        return { Error: 'Not found' };
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { Error: 'Not found' };
        }
        return { Error: 'HaveIBeenPwned API unavailable' };
    }
}

async function getBreachAnalytics(email) {
    try {
        // Add proper headers to avoid 403 errors
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
        const response = await axios.get(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`, config);
        const data = response.data;

        // If detailed info available
        const breachesDetails = data?.ExposedBreaches?.breaches_details;
        const metricsRiskScore = data?.BreachMetrics?.risk?.[0]?.risk_score;
        if (Array.isArray(breachesDetails) && breachesDetails.length > 0) {
            const breaches = breachesDetails.map((b) => {
                const name = b.breach || b.Name || b.Title || 'Unknown Breach';
                const date = b.xposed_date || b.breachedDate || 'Unknown';
                const description = b.details || b.exposureDescription || `Email found in ${name} breach`;
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
            return { breaches, riskScore: metricsRiskScore, raw: data };
        }
        
        // Fallback to lightweight name-only endpoint
        const fallback = await axios.get(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`, config).then(r => r.data).catch(() => null);
        if (fallback && fallback.breaches && Array.isArray(fallback.breaches[0]) && fallback.breaches[0].length > 0) {
            const names = fallback.breaches[0];
            return { breaches: names, raw: fallback };
        }
        
        // Handle error responses
        if (data && data.Error) {
            return { Error: data.Error };
        }
        
        // No breaches found (clean email)
        return { Error: 'Not found' };
        
    } catch (error) {
        if (error.response) {
            if (error.response.status === 403) {
                // Try fallback API
                const fallbackResult = await getBreachAnalyticsHIBP(email);
                if (fallbackResult && !fallbackResult.Error) {
                    // Map HIBP results (names only)
                    return { breaches: fallbackResult.breaches, raw: fallbackResult };
                }
                return { Error: 'API access denied. Please try again later.' };
            }
            if (error.response.status === 404) {
                return { Error: 'Not found' };
            }
            if (error.response.status === 429) {
                return { Error: 'Rate limit exceeded. Please try again later.' };
            }
            return { Error: `API error: ${error.response.status}` };
        }
        if (error.code === 'ECONNABORTED') {
            return { Error: 'Request timeout. Please try again.' };
        }
        return { Error: 'Unable to reach breach database' };
    }
}

app.post('/api/check-breach', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const analyticsData = await getBreachAnalytics(email);
        
        // If we have rich breach objects
        if (analyticsData && Array.isArray(analyticsData.breaches) && analyticsData.breaches.length > 0 && typeof analyticsData.breaches[0] === 'object') {
            const breachDetails = analyticsData.breaches;
            const computedScore = Number.isFinite(analyticsData.riskScore)
                ? Math.max(0, Math.min(100, Math.round(analyticsData.riskScore)))
                : Math.min(breachDetails.length * 10, 100);
            const threatProfile = computedScore < 25 ? 'Low risk. Few breaches detected.' : 
                                  computedScore < 50 ? 'Medium risk. Multiple breaches detected.' : 
                                  computedScore < 75 ? 'High risk. Many breaches detected.' : 
                                  'Critical risk. Extensive breach exposure.';
            
            return res.json({
                breachScore: computedScore,
                threatProfileSummary: threatProfile,
                breachDetails,
                analytics: analyticsData.raw || null
            });
        }

        // If we only have names array from fallback
        if (analyticsData && Array.isArray(analyticsData.breaches) && analyticsData.breaches.length > 0 && typeof analyticsData.breaches[0] === 'string') {
            const names = analyticsData.breaches;
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
            const threatProfile = breachScore < 25 ? 'Low risk. Few breaches detected.' : 
                                  breachScore < 50 ? 'Medium risk. Multiple breaches detected.' : 
                                  breachScore < 75 ? 'High risk. Many breaches detected.' : 
                                  'Critical risk. Extensive breach exposure.';
            return res.json({
                breachScore,
                threatProfileSummary: threatProfile,
                breachDetails,
                analytics: analyticsData.raw || null
            });
        }
        
        // Handle specific errors
        if (analyticsData && analyticsData.Error) {
            if (analyticsData.Error === 'Rate limit exceeded. Please try again later.') {
                return res.json({
                    breachScore: 0,
                    threatProfileSummary: analyticsData.Error,
                    breachDetails: []
                });
            }
        }
        
        // No breaches found (clean email)
        return res.json({
            breachScore: 0,
            threatProfileSummary: 'No breaches found. Your email appears to be secure.',
            breachDetails: []
        });
        
    } catch (error) {
        console.error('API endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});