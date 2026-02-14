import { Router } from 'express';
import { getDailyPrices, getCompanyOverview, getAnalystData, getInsiderData, getRiskData, isUsingMockData, getAssetType } from '../services/alphaVantage.js';
import { getThesisData } from '../mock/etfMockData.js';
import { analyzeSignal1 } from '../services/signal1-trend.js';
import { analyzeSignal2 } from '../services/signal2-fundamentals.js';
import { analyzeSignal3 } from '../services/signal3-analyst.js';
import { analyzeSignal4 } from '../services/signal4-insiders.js';
import { analyzeSignal5 } from '../services/signal5-risk.js';
import { analyzeSignal6 } from '../services/signal6-thesis.js';
import { computeOverlap } from '../services/overlapAnalysis.js';
import { computeConvergence } from '../services/convergence.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    const [prices, overview, analystData, insiderData, riskData] = await Promise.all([
      getDailyPrices(ticker),
      getCompanyOverview(ticker),
      getAnalystData(ticker),
      getInsiderData(ticker),
      getRiskData(ticker),
    ]);

    if (!prices && !overview) {
      return res.status(404).json({
        error: `No data found for ticker "${ticker}". Try a stock (AAPL, MSFT, GOOGL, TSLA, AMZN, META) or an ETF (SMH, SOXX, QQQ, VOO, etc.)`,
      });
    }

    const assetType = getAssetType(ticker);
    const thesis = getThesisData(ticker);

    const signal1 = analyzeSignal1(prices);
    const signal2 = analyzeSignal2(overview);
    const signal3 = analyzeSignal3(analystData);
    const signal4 = analyzeSignal4(insiderData);
    const signal5 = analyzeSignal5(riskData);
    const signals = [signal1, signal2, signal3, signal4, signal5];

    const signal6 = analyzeSignal6(ticker);
    if (signal6) signals.push(signal6);

    const convergence = computeConvergence(signals);
    const overlap = assetType === 'etf' ? computeOverlap(ticker) : null;

    res.json({
      ticker,
      name: overview?.name || ticker,
      sector: overview?.sector || 'Unknown',
      currentPrice: prices?.[prices.length - 1]?.close || null,
      priceHistory: prices?.slice(-90) || [],
      signals,
      convergence,
      overlap,
      assetType,
      thesis,
      usingMockData: isUsingMockData(),
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

export default router;
