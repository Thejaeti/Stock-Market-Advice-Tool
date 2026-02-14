import { Router } from 'express';

const router = Router();

// In-memory store for API keys (persists only while server runs)
const apiKeys = {
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY || '',
  finnhub: process.env.FINNHUB_API_KEY || '',
};

router.get('/', (req, res) => {
  res.json({
    alphaVantage: apiKeys.alphaVantage ? '••••' + apiKeys.alphaVantage.slice(-4) : '',
    finnhub: apiKeys.finnhub ? '••••' + apiKeys.finnhub.slice(-4) : '',
    usingMockData: !apiKeys.alphaVantage,
  });
});

router.post('/', (req, res) => {
  const { alphaVantage, finnhub } = req.body;
  if (alphaVantage !== undefined) apiKeys.alphaVantage = alphaVantage;
  if (finnhub !== undefined) apiKeys.finnhub = finnhub;
  res.json({ success: true, usingMockData: !apiKeys.alphaVantage });
});

export function getApiKey(service) {
  return apiKeys[service] || '';
}

export default router;
