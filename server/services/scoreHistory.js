import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { analyzeSignal1 } from './signal1-trend.js';
import { analyzeSignal5 } from './signal5-risk.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = join(__dirname, '..', 'data', 'history');
const MAX_ENTRIES = 365;

function filePath(ticker) {
  return join(HISTORY_DIR, `${ticker.toUpperCase()}.json`);
}

export async function loadHistory(ticker) {
  try {
    const raw = await readFile(filePath(ticker), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function appendEntry(ticker, entry) {
  await mkdir(HISTORY_DIR, { recursive: true });
  const entries = await loadHistory(ticker);

  // Replace existing entry for the same date, or append
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }

  // Sort by date ascending
  entries.sort((a, b) => a.date.localeCompare(b.date));

  // Prune oldest if over cap
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }

  await writeFile(filePath(ticker), JSON.stringify(entries, null, 2));
}

export function computeBackfill(prices) {
  if (!prices || prices.length < 50) return [];

  const results = [];

  for (let i = 50; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const date = slice[slice.length - 1].date;

    // Signal 1
    const s1 = analyzeSignal1(slice);

    // Signal 5 — volatility & drawdown from prices (no beta/debtToEquity)
    let historicalVolatility = null;
    let maxDrawdown = null;

    if (slice.length >= 20) {
      const logReturns = [];
      for (let j = 1; j < slice.length; j++) {
        logReturns.push(Math.log(slice[j].close / slice[j - 1].close));
      }
      const mean = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
      const variance = logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
      historicalVolatility = Math.sqrt(variance) * Math.sqrt(252);

      let peak = slice[0].close;
      let maxDd = 0;
      for (const p of slice) {
        if (p.close > peak) peak = p.close;
        const dd = (p.close - peak) / peak;
        if (dd < maxDd) maxDd = dd;
      }
      maxDrawdown = maxDd;
    }

    const s5 = analyzeSignal5({ historicalVolatility, maxDrawdown, beta: null, debtToEquity: null });

    const composite = +(s1.score + s5.score).toFixed(2);

    results.push({
      date,
      scores: { signal1: s1.score, signal5: s5.score },
      composite,
      label: null,
      signalCount: 2,
      source: 'backfill',
    });
  }

  return results;
}
