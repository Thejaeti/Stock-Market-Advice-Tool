import { getApiKey } from '../routes/settings.js';
import * as cache from '../cache.js';

const BASE_URL = 'https://finnhub.io/api/v1';

async function fetchFromFinnhub(path, params = {}) {
  const apiKey = getApiKey('finnhub');
  if (!apiKey) return null;

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('token', apiKey);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 429) console.warn('Finnhub rate limit hit');
    return null;
  }
  const data = await res.json();
  if (data.error) return null;
  return data;
}

/**
 * Fetch insider transactions for a stock ticker.
 * Returns shape expected by signal4-insiders.js:
 * { insiderTransactions: [{ type, value, date }], institutionalOwnership, institutionalOwnershipPrior }
 */
export async function getInsiderTransactions(ticker) {
  const cacheKey = `finnhub-insider:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch last 6 months of insider transactions
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fromDate = sixMonthsAgo.toISOString().split('T')[0];

  const data = await fetchFromFinnhub('/stock/insider-transactions', {
    symbol: ticker,
    from: fromDate,
  });

  if (!data || !data.data || data.data.length === 0) return null;

  // Transform Finnhub transactions to our expected shape
  // Finnhub: { name, share, change, transactionDate, transactionCode, transactionPrice }
  // transactionCode: P = purchase, S = sale, A = grant/award, M = exercise
  const transactions = data.data
    .filter((t) => t.transactionCode === 'P' || t.transactionCode === 'S')
    .map((t) => ({
      type: t.transactionCode === 'P' ? 'buy' : 'sell',
      value: Math.abs((t.change || 0) * (t.transactionPrice || 0)),
      date: t.transactionDate,
    }))
    .filter((t) => t.value > 0);

  // Note: Finnhub free tier doesn't give clean institutional ownership %.
  // We leave those null so Signal 4 scores only on insider transactions.
  // The UI will show this signal as "live" for the insider component but
  // institutional ownership scoring will be skipped (scores 0, not mock data).
  const result = {
    insiderTransactions: transactions,
    institutionalOwnership: null,
    institutionalOwnershipPrior: null,
  };

  cache.set(cacheKey, result);
  return result;
}

