// Overlap Analysis: Computes holding overlap between thesis ETFs
// Compares a target ETF's top holdings against all other thesis ETFs

import { getEtfMockData, getEtfMockTickers } from '../mock/etfMockData.js';

export function computeOverlap(ticker, targetHoldings) {
  // Use provided live holdings if available, otherwise fall back to mock
  if (!targetHoldings) {
    const target = getEtfMockData(ticker);
    if (!target || !target.insiderData?.topHoldings) return null;
    targetHoldings = target.insiderData.topHoldings;
  }

  const targetSet = new Map(targetHoldings.map((h) => [h.ticker, h.weight]));

  const allTickers = getEtfMockTickers();
  const overlaps = [];

  for (const otherTicker of allTickers) {
    if (otherTicker === ticker.toUpperCase()) continue;

    const other = getEtfMockData(otherTicker);
    if (!other || !other.insiderData?.topHoldings) continue;

    const otherHoldings = other.insiderData.topHoldings;
    const sharedHoldings = [];

    for (const holding of otherHoldings) {
      if (targetSet.has(holding.ticker)) {
        sharedHoldings.push({
          ticker: holding.ticker,
          weightInTarget: targetSet.get(holding.ticker),
          weightInOther: holding.weight,
        });
      }
    }

    if (sharedHoldings.length < 2) continue;

    const sharedWeightInTarget = sharedHoldings.reduce((sum, h) => sum + h.weightInTarget, 0);
    const sharedWeightInOther = sharedHoldings.reduce((sum, h) => sum + h.weightInOther, 0);
    const overlapPct = (sharedWeightInTarget + sharedWeightInOther) / 2;

    if (sharedHoldings.length >= 2 || overlapPct > 5) {
      overlaps.push({
        ticker: otherTicker,
        name: other.overview.name,
        sharedCount: sharedHoldings.length,
        overlapPct: +overlapPct.toFixed(1),
        sharedHoldings: sharedHoldings.sort((a, b) => b.weightInTarget - a.weightInTarget),
      });
    }
  }

  return overlaps.sort((a, b) => b.overlapPct - a.overlapPct);
}
