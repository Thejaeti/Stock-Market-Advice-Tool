// Overlap Analysis: Computes holding overlap between thesis ETFs
// Compares a target ETF's top holdings against all other thesis ETFs
// Note: Uses mock holdings data — live ETF holdings APIs (Finnhub, etc.) are paywalled

import { getEtfMockData, getEtfMockTickers } from '../mock/etfMockData.js';

export function computeOverlap(ticker) {
  const targetMock = getEtfMockData(ticker);
  const targetHoldings = targetMock?.insiderData?.topHoldings;
  if (!targetHoldings) return null;

  const targetSet = new Map(targetHoldings.map((h) => [h.ticker, h.weight]));

  const allTickers = getEtfMockTickers();
  const overlaps = [];

  for (const otherTicker of allTickers) {
    if (otherTicker === ticker.toUpperCase()) continue;

    const otherMock = getEtfMockData(otherTicker);
    const otherHoldings = otherMock?.insiderData?.topHoldings;
    if (!otherHoldings) continue;

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
        name: otherMock?.overview?.name || otherTicker,
        sharedCount: sharedHoldings.length,
        overlapPct: +overlapPct.toFixed(1),
        sharedHoldings: sharedHoldings.sort((a, b) => b.weightInTarget - a.weightInTarget),
      });
    }
  }

  return overlaps.sort((a, b) => b.overlapPct - a.overlapPct);
}
