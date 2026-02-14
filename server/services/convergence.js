// Convergence Engine
// Combines multiple signal scores into a composite convergence assessment
// Scales proportionally for variable signal count (5 base, 6 with thesis)

export function computeConvergence(signals) {
  if (!signals || signals.length === 0) {
    return {
      compositeScore: 0,
      label: 'No Signals',
      summary: 'No signals were available for analysis.',
      confidence: 'low',
      dissenting: false,
    };
  }

  const signalCount = signals.length;
  const scores = signals.map((s) => s.score);
  const compositeScore = scores.reduce((a, b) => a + b, 0);

  // Count signal directions
  const bullishCount = scores.filter((s) => s >= 0.5).length;
  const bearishCount = scores.filter((s) => s <= -0.5).length;
  const neutralCount = scores.filter((s) => s > -0.5 && s < 0.5).length;

  // Check for strong dissent (at least one signal strongly disagrees with the majority)
  const hasStrongBullish = scores.some((s) => s >= 1.5);
  const hasStrongBearish = scores.some((s) => s <= -1.5);
  const dissenting = hasStrongBullish && hasStrongBearish;

  // Scale thresholds proportionally to signal count
  // When signalCount=5 → identical to original hardcoded values (7, 4, -3, -7)
  // When signalCount=6 → thresholds expand proportionally (8.4, 4.8, -3.6, -8.4)
  const scale = signalCount / 5;
  const strongBullishThreshold = 7 * scale;
  const modBullishThreshold = 4 * scale;
  const modBearishThreshold = -3 * scale;
  const strongBearishThreshold = -7 * scale;

  let label;
  let summary;
  let confidence;

  if (dissenting) {
    label = 'Mixed Signals';
    summary =
      `Signals are strongly conflicting — at least one dimension is significantly bullish while another is significantly bearish. Exercise caution and wait for clearer alignment across the ${signalCount} signal dimensions.`;
    confidence = 'low';
  } else if (compositeScore >= strongBullishThreshold) {
    label = 'Strong Bullish Convergence';
    summary =
      `${bullishCount} of ${signalCount} signals align bullish. Price momentum, valuation, analyst sentiment, institutional activity, and risk profile broadly support a positive outlook with high conviction.`;
    confidence = 'high';
  } else if (compositeScore >= modBullishThreshold) {
    label = 'Moderate Bullish Lean';
    summary =
      `${bullishCount} of ${signalCount} signals lean bullish. The weight of evidence across technical, fundamental, sentiment, ownership, and risk dimensions favors upside, though not all signals are strongly aligned.`;
    confidence = 'moderate';
  } else if (compositeScore >= modBearishThreshold) {
    label = 'No Clear Edge';
    summary =
      `Signals are mixed: ${bullishCount} bullish, ${bearishCount} bearish, ${neutralCount} neutral across ${signalCount} dimensions. There is no strong directional consensus. Consider waiting for stronger alignment before acting.`;
    confidence = 'low';
  } else if (compositeScore >= strongBearishThreshold) {
    label = 'Moderate Bearish Lean';
    summary =
      `${bearishCount} of ${signalCount} signals lean bearish. Technical momentum, valuation, analyst views, insider activity, and/or risk factors suggest caution at current levels.`;
    confidence = 'moderate';
  } else {
    label = 'Strong Bearish Convergence';
    summary =
      `${bearishCount} of ${signalCount} signals align bearish. Broad weakness across price trend, fundamentals, analyst sentiment, insider activity, and risk metrics suggests significant downside risk.`;
    confidence = 'high';
  }

  return {
    compositeScore: +compositeScore.toFixed(1),
    label,
    summary,
    confidence,
    dissenting,
    signalCount,
    bullishCount,
    bearishCount,
    neutralCount,
  };
}
