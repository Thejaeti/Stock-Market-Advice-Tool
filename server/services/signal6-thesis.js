// Signal 6: AI Thesis Alignment
// Scores how well an ETF aligns with the AI infrastructure investment thesis
// Returns null for non-thesis tickers (not added to signals array)

import { getThesisData } from '../mock/etfMockData.js';

export function analyzeSignal6(ticker) {
  const thesis = getThesisData(ticker);
  if (!thesis) return null;

  const explanations = [];
  let score = 0;

  // Avoid tickers → immediate score -2
  if (thesis.avoid) {
    return {
      signal: 'Signal 6: AI Thesis Alignment',
      score: -2,
      label: 'Avoid',
      explanation: `${ticker} is on the thesis avoid list. ${thesis.note}`,
      components: {
        tier: 'avoid',
        tierName: thesis.tierName,
        baseScore: -2,
        bonusPenalty: 0,
        finalScore: -2,
      },
    };
  }

  // Tier-based scoring
  const tierScores = { 1: 1.5, 2: 1.25, 3: 1.0, 4: 0.5, 5: 0.25 };
  const base = tierScores[thesis.tier] || 0;
  score = base;
  explanations.push(
    `${ticker} is ${thesis.label} — base alignment score of ${base > 0 ? '+' : ''}${base.toFixed(2)}.`
  );

  // Tier-specific bonuses and penalties
  let bonusPenalty = 0;

  if (thesis.tier === 1) {
    bonusPenalty = 0.5;
    explanations.push(
      'Tier 1 bonus (+0.5): Direct compute hardware exposure — the primary bottleneck for AI scaling.'
    );
  } else if (thesis.tier === 2) {
    bonusPenalty = 0.5;
    explanations.push(
      'Tier 2 bonus (+0.5): Power infrastructure is the second-order bottleneck — data center energy demand is surging.'
    );
  } else if (thesis.tier === 3) {
    bonusPenalty = 0.25;
    explanations.push(
      'Tier 3 bonus (+0.25): Data center and digital infrastructure exposure supports AI deployment at scale.'
    );
  } else if (thesis.tier === 4) {
    if (ticker === 'QQQM' || ticker === 'QQQ') {
      bonusPenalty = -0.25;
      explanations.push(
        'Tier 4 penalty (-0.25): NASDAQ 100 carries significant SaaS and ad-tech exposure that dilutes the AI hardware thesis.'
      );
    } else {
      explanations.push(
        'Tier 4: Broad market ETF — provides diversified AI exposure but diluted by non-AI holdings.'
      );
    }
  } else if (thesis.tier === 5) {
    bonusPenalty = -0.25;
    explanations.push(
      'Tier 5 penalty (-0.25): Healthcare/biotech carries long-duration pipeline risk and regulatory uncertainty.'
    );
  }

  score += bonusPenalty;
  score = Math.max(-2, Math.min(2, Math.round(score * 2) / 2));

  let label;
  if (score >= 1.5) label = 'Strongly Aligned';
  else if (score >= 1.0) label = 'Aligned';
  else if (score >= 0.5) label = 'Weakly Aligned';
  else if (score >= -0.5) label = 'Misaligned';
  else label = 'Strongly Misaligned';

  return {
    signal: 'Signal 6: AI Thesis Alignment',
    score,
    label,
    explanation: explanations.join(' '),
    components: {
      tier: thesis.tier,
      tierName: thesis.tierName,
      baseScore: base,
      bonusPenalty,
      finalScore: score,
    },
  };
}
