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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 10000
        };
        
        const response = await axios.get(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`, config);
        
        // Check if response has breaches array and it contains data
        if (response.data && response.data.breaches && Array.isArray(response.data.breaches) && response.data.breaches.length > 0) {
            // The API returns breaches as nested array: breaches[0] contains the actual breach names
            const breaches = response.data.breaches[0];
            
            if (Array.isArray(breaches) && breaches.length > 0) {
                return { breaches };
            }
        }
        
        // Handle error responses
        if (response.data && response.data.Error) {
            return { Error: response.data.Error };
        }
        
        // No breaches found (clean email)
        return { Error: 'Not found' };
        
    } catch (error) {
        if (error.response) {
            if (error.response.status === 403) {
                // Try fallback API
                const fallbackResult = await getBreachAnalyticsHIBP(email);
                if (fallbackResult && !fallbackResult.Error) {
                    return fallbackResult;
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
        
        // Check if we have actual breach data
        if (analyticsData && analyticsData.breaches && Array.isArray(analyticsData.breaches) && analyticsData.breaches.length > 0) {
            const breaches = analyticsData.breaches;
            const breachScore = Math.min(breaches.length * 10, 100); // Cap at 100
            const threatProfile = breachScore < 25 ? "Low risk. Few breaches detected." : 
                                breachScore < 50 ? "Medium risk. Multiple breaches detected." : 
                                breachScore < 75 ? "High risk. Many breaches detected." : 
                                "Critical risk. Extensive breach exposure.";
            
            const breachDetails = breaches.map(breach => ({
                name: breach || 'Unknown Breach',
                date: 'Unknown',
                description: `Email found in ${breach} breach`,
                dataTypes: ['Email addresses'],
                affectedAccounts: 0,
                domain: 'Unknown',
                industry: 'Unknown',
                passwordRisk: 'Unknown'
            }));
            
            return res.json({
                breachScore,
                threatProfileSummary: threatProfile,
                breachDetails,
                analytics: analyticsData
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
            threatProfileSummary: "No breaches found. Your email appears to be secure.",
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