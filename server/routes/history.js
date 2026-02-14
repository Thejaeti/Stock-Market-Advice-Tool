import { Router } from 'express';
import { getDailyPrices } from '../services/alphaVantage.js';
import { computeBackfill, loadHistory } from '../services/scoreHistory.js';
import * as cache from '../cache.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const cacheKey = `history:${ticker}`;

    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const prices = await getDailyPrices(ticker);
    const backfill = computeBackfill(prices);
    const logged = await loadHistory(ticker);

    // Merge: logged entries overwrite backfill for the same date
    const byDate = new Map();
    for (const entry of backfill) {
      byDate.set(entry.date, entry);
    }
    for (const entry of logged) {
      byDate.set(entry.date, entry);
    }

    const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    cache.set(cacheKey, merged);
    res.json(merged);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to compute score history.' });
  }
});

export default router;
