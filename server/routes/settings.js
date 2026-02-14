import { Router } from 'express';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getRateLimitStatus } from '../rateLimiter.js';

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(__dirname, '..', 'data', 'settings.json');

// Seed from env vars, then override with persisted file values
const apiKeys = {
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY || '',
  finnhub: process.env.FINNHUB_API_KEY || '',
};

async function loadKeys() {
  try {
    const data = JSON.parse(await readFile(SETTINGS_PATH, 'utf-8'));
    if (data.alphaVantage !== undefined) apiKeys.alphaVantage = data.alphaVantage;
    if (data.finnhub !== undefined) apiKeys.finnhub = data.finnhub;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Warning: could not load settings.json, using env vars:', err.message);
    }
  }
}

async function saveKeys() {
  await mkdir(dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(apiKeys, null, 2) + '\n');
}

await loadKeys();

router.get('/', (req, res) => {
  res.json({
    alphaVantage: apiKeys.alphaVantage ? '••••' + apiKeys.alphaVantage.slice(-4) : '',
    finnhub: apiKeys.finnhub ? '••••' + apiKeys.finnhub.slice(-4) : '',
    usingMockData: !apiKeys.alphaVantage,
    rateLimits: getRateLimitStatus(),
  });
});

router.post('/', async (req, res) => {
  const { alphaVantage, finnhub } = req.body;
  if (alphaVantage !== undefined) apiKeys.alphaVantage = alphaVantage;
  if (finnhub !== undefined) apiKeys.finnhub = finnhub;
  await saveKeys();
  res.json({ success: true, usingMockData: !apiKeys.alphaVantage });
});

export function getApiKey(service) {
  return apiKeys[service] || '';
}

export default router;
