// Signal 2: Fundamental Valuation
// Compares company metrics against sector median benchmarks

const SECTOR_MEDIANS = {
  Technology: { peRatio: 30, psRatio: 8, pfcfRatio: 30 },
  'Consumer Cyclical': { peRatio: 22, psRatio: 1.5, pfcfRatio: 20 },
  'Communication Services': { peRatio: 20, psRatio: 3, pfcfRatio: 22 },
  Healthcare: { peRatio: 25, psRatio: 4, pfcfRatio: 25 },
  Financials: { peRatio: 14, psRatio: 3, pfcfRatio: 12 },
  'Consumer Defensive': { peRatio: 24, psRatio: 2, pfcfRatio: 22 },
  Industrials: { peRatio: 22, psRatio: 2.5, pfcfRatio: 20 },
  Energy: { peRatio: 12, psRatio: 1.5, pfcfRatio: 10 },
  Utilities: { peRatio: 18, psRatio: 2, pfcfRatio: 15 },
  'Real Estate': { peRatio: 35, psRatio: 8, pfcfRatio: 30 },
  'Basic Materials': { peRatio: 15, psRatio: 2, pfcfRatio: 14 },
};

const DEFAULT_MEDIANS = { peRatio: 22, psRatio: 3, pfcfRatio: 20 };

function scoreMetric(value, median, name) {
  if (!value || value <= 0) {
    return { score: 0, explanation: `${name} is not available or negative — skipping.` };
  }

  const ratio = value / median;

  if (ratio < 0.6) {
    return {
      score: 1,
      explanation: `${name} of ${value.toFixed(1)} is well below the sector median of ${median} — significantly undervalued on this metric.`,
    };
  } else if (ratio < 0.85) {
    return {
      score: 0.5,
      explanation: `${name} of ${value.toFixed(1)} is below the sector median of ${median} — modestly undervalued.`,
    };
  } else if (ratio <= 1.15) {
    return {
      score: 0,
      explanation: `${name} of ${value.toFixed(1)} is roughly in line with the sector median of ${median} — fairly valued.`,
    };
  } else if (ratio <= 1.5) {
    return {
      score: -0.5,
      explanation: `${name} of ${value.toFixed(1)} is above the sector median of ${median} — modestly overvalued.`,
    };
  } else {
    return {
      score: -1,
      explanation: `${name} of ${value.toFixed(1)} is well above the sector median of ${median} — significantly overvalued on this metric.`,
    };
  }
}

export function analyzeSignal2(overview) {
  if (!overview) {
    return {
      signal: 'Signal 2: Fundamental Valuation',
      score: 0,
      label: 'No Data',
      explanation: 'Company overview data is not available.',
      components: {},
    };
  }

  // ETF branch: detected by expenseRatio field
  if (overview.expenseRatio != null) {
    return analyzeEtfFundamentals(overview);
  }

  const medians = SECTOR_MEDIANS[overview.sector] || DEFAULT_MEDIANS;
  const explanations = [];
  let totalScore = 0;
  let metricsUsed = 0;

  // P/E Ratio (weight: higher)
  const pe = scoreMetric(overview.peRatio, medians.peRatio, 'P/E Ratio');
  explanations.push(pe.explanation);
  if (overview.peRatio > 0) {
    totalScore += pe.score * 1.2; // slight extra weight
    metricsUsed++;
  }

  // P/S Ratio
  const ps = scoreMetric(overview.psRatio, medians.psRatio, 'P/S Ratio');
  explanations.push(ps.explanation);
  if (overview.psRatio > 0) {
    totalScore += ps.score;
    metricsUsed++;
  }

  // P/FCF Ratio
  const pfcf = scoreMetric(overview.pfcfRatio, medians.pfcfRatio, 'P/FCF Ratio');
  explanations.push(pfcf.explanation);
  if (overview.pfcfRatio > 0) {
    totalScore += pfcf.score;
    metricsUsed++;
  }

  // Growth modifier: high growth can justify higher multiples
  if (overview.earningsGrowth > 0.2) {
    totalScore += 0.5;
    explanations.push(
      `Earnings growth of ${(overview.earningsGrowth * 100).toFixed(0)}% is strong — higher valuations may be justified.`
    );
  } else if (overview.earningsGrowth < -0.05) {
    totalScore -= 0.5;
    explanations.push(
      `Earnings growth of ${(overview.earningsGrowth * 100).toFixed(0)}% is negative — current valuations may not be supported.`
    );
  }

  // Normalize and clamp to [-2, 2]
  const normalized = metricsUsed > 0 ? totalScore / (metricsUsed * 0.5) : 0;
  const finalScore = Math.max(-2, Math.min(2, Math.round(normalized * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 2: Fundamental Valuation',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      peRatio: overview.peRatio,
      psRatio: overview.psRatio,
      pfcfRatio: overview.pfcfRatio,
      sectorMedians: medians,
      earningsGrowth: overview.earningsGrowth,
      sector: overview.sector,
      peScore: pe.score,
      psScore: ps.score,
      pfcfScore: pfcf.score,
    },
  };
}

// --- ETF Fundamentals & Efficiency ---
function analyzeEtfFundamentals(overview) {
  const explanations = [];
  let totalScore = 0;

  // Expense Ratio: lower is better
  let expenseScore = 0;
  if (overview.expenseRatio <= 0.10) {
    expenseScore = 1;
    explanations.push(`Expense ratio of ${overview.expenseRatio.toFixed(2)}% is exceptionally low — minimal drag on returns.`);
  } else if (overview.expenseRatio <= 0.25) {
    expenseScore = 0.5;
    explanations.push(`Expense ratio of ${overview.expenseRatio.toFixed(2)}% is competitive — low cost for the exposure.`);
  } else if (overview.expenseRatio <= 0.50) {
    expenseScore = 0;
    explanations.push(`Expense ratio of ${overview.expenseRatio.toFixed(2)}% is moderate — typical for a specialized ETF.`);
  } else if (overview.expenseRatio <= 0.75) {
    expenseScore = -0.5;
    explanations.push(`Expense ratio of ${overview.expenseRatio.toFixed(2)}% is elevated — cost drag may erode returns over time.`);
  } else {
    expenseScore = -1;
    explanations.push(`Expense ratio of ${overview.expenseRatio.toFixed(2)}% is high — significant fee headwind.`);
  }
  totalScore += expenseScore;

  // AUM: larger is better (liquidity, tighter spreads)
  let aumScore = 0;
  const aumB = overview.aum / 1e9;
  if (aumB >= 10) {
    aumScore = 0.5;
    explanations.push(`AUM of $${aumB.toFixed(1)}B indicates strong institutional adoption and deep liquidity.`);
  } else if (aumB >= 1) {
    aumScore = 0.25;
    explanations.push(`AUM of $${aumB.toFixed(1)}B reflects solid fund size with adequate liquidity.`);
  } else if (aumB >= 0.1) {
    aumScore = 0;
    explanations.push(`AUM of $${(overview.aum / 1e6).toFixed(0)}M is modest — may have wider spreads during volatility.`);
  } else {
    aumScore = -0.5;
    explanations.push(`AUM of $${(overview.aum / 1e6).toFixed(0)}M is small — liquidity risk and potential closure risk.`);
  }
  totalScore += aumScore;

  // Premium/Discount to NAV
  let navScore = 0;
  const pd = overview.premiumDiscount;
  if (Math.abs(pd) <= 0.02) {
    navScore = 0.25;
    explanations.push(`Trading near NAV (${pd > 0 ? '+' : ''}${(pd * 100).toFixed(1)}% premium/discount) — efficient pricing.`);
  } else if (pd > 0.05) {
    navScore = -0.5;
    explanations.push(`Trading at a ${(pd * 100).toFixed(1)}% premium to NAV — buyers are overpaying relative to holdings.`);
  } else if (pd < -0.05) {
    navScore = -0.25;
    explanations.push(`Trading at a ${(pd * 100).toFixed(1)}% discount to NAV — may signal weak demand or structural issues.`);
  } else {
    explanations.push(`Premium/discount of ${pd > 0 ? '+' : ''}${(pd * 100).toFixed(1)}% is within normal range.`);
  }
  totalScore += navScore;

  // Tracking Error
  let trackingScore = 0;
  if (overview.trackingError <= 0.10) {
    trackingScore = 0.5;
    explanations.push(`Tracking error of ${overview.trackingError.toFixed(2)}% is excellent — tight index replication.`);
  } else if (overview.trackingError <= 0.30) {
    trackingScore = 0.25;
    explanations.push(`Tracking error of ${overview.trackingError.toFixed(2)}% is acceptable for the category.`);
  } else if (overview.trackingError <= 0.60) {
    trackingScore = 0;
    explanations.push(`Tracking error of ${overview.trackingError.toFixed(2)}% is moderate — some deviation from the index.`);
  } else {
    trackingScore = -0.5;
    explanations.push(`Tracking error of ${overview.trackingError.toFixed(2)}% is high — significant deviation from benchmark, may reflect active management or illiquid holdings.`);
  }
  totalScore += trackingScore;

  // YTD Return (performance momentum)
  let returnScore = 0;
  if (overview.ytdReturn > 15) {
    returnScore = 0.5;
    explanations.push(`YTD return of ${overview.ytdReturn.toFixed(1)}% shows strong momentum in the underlying theme.`);
  } else if (overview.ytdReturn > 5) {
    returnScore = 0.25;
    explanations.push(`YTD return of ${overview.ytdReturn.toFixed(1)}% reflects positive but modest momentum.`);
  } else if (overview.ytdReturn > -5) {
    returnScore = 0;
    explanations.push(`YTD return of ${overview.ytdReturn.toFixed(1)}% is flat — no clear directional momentum.`);
  } else {
    returnScore = -0.5;
    explanations.push(`YTD return of ${overview.ytdReturn.toFixed(1)}% signals negative momentum in this theme.`);
  }
  totalScore += returnScore;

  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 2: ETF Fundamentals & Efficiency',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      expenseRatio: overview.expenseRatio,
      aumBillions: +(overview.aum / 1e9).toFixed(2),
      premiumDiscount: overview.premiumDiscount,
      trackingError: overview.trackingError,
      ytdReturn: overview.ytdReturn,
      oneYearReturn: overview.oneYearReturn,
      holdingsCount: overview.holdingsCount,
      expenseScore,
      aumScore,
      navScore,
      trackingScore,
      returnScore,
    },
  };
}
