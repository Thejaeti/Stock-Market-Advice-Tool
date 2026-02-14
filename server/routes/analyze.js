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
import { appendEntry } from '../services/scoreHistory.js';

const router = Router();

function src(data) {
  return data?._source || 'mock';
}

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

    const currentPrice = prices?.[prices.length - 1]?.close || null;
    if (analystData && analystData.currentPrice == null && currentPrice) {
      analystData.currentPrice = currentPrice;
    }

    // Inject computed risk metrics from price data
    if (riskData && prices && prices.length >= 20) {
      if (riskData.historicalVolatility == null) {
        const logReturns = [];
        for (let i = 1; i < prices.length; i++) {
          logReturns.push(Math.log(prices[i].close / prices[i - 1].close));
        }
        const mean = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
        const variance = logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
        riskData.historicalVolatility = Math.sqrt(variance) * Math.sqrt(252);
      }
      if (riskData.maxDrawdown == null) {
        let peak = prices[0].close;
        let maxDd = 0;
        for (const p of prices) {
          if (p.close > peak) peak = p.close;
          const dd = (p.close - peak) / peak;
          if (dd < maxDd) maxDd = dd;
        }
        riskData.maxDrawdown = maxDd;
      }
    }

    const assetType = getAssetType(ticker);
    const thesis = getThesisData(ticker);

    const signal1 = analyzeSignal1(prices);
    const signal2 = analyzeSignal2(overview);
    const signal3 = analyzeSignal3(analystData);
    const signal4 = analyzeSignal4(insiderData);
    const signal5 = analyzeSignal5(riskData);
    const signals = [signal1, signal2, signal3, signal4, signal5];

    // Tag each signal with its data source
    signal1.dataSource = src(prices);
    signal2.dataSource = src(overview);
    signal3.dataSource = src(analystData);
    signal4.dataSource = src(insiderData);
    // Signal 5 uses both riskData (from AV OVERVIEW) and prices — mock if either is mock
    signal5.dataSource = src(riskData) === 'mock' || src(prices) === 'mock' ? 'mock' : 'live';

    const signal6 = analyzeSignal6(ticker);
    if (signal6) {
      signal6.dataSource = 'config';
      signals.push(signal6);
    }

    const convergence = computeConvergence(signals);

    // Pass live ETF holdings to overlap if available
    const liveHoldings = insiderData?.topHoldings && src(insiderData) !== 'mock'
      ? insiderData.topHoldings : undefined;
    const overlap = assetType === 'etf' ? computeOverlap(ticker, liveHoldings) : null;

    // Fire-and-forget: log scores for historical tracking
    const today = new Date().toISOString().split('T')[0];
    const scores = {};
    signals.forEach((s, i) => { scores[`signal${i + 1}`] = s.score; });
    appendEntry(ticker, {
      date: today,
      scores,
      composite: convergence.compositeScore,
      label: convergence.label,
      signalCount: signals.length,
      source: 'live',
    }).catch(err => console.warn('Failed to log score history:', err.message));

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
