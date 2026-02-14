// Signal 5: Risk & Volatility Assessment
// Not directional — measures risk-adjusted favorability
// Low risk = mildly bullish, high risk = bearish

export function analyzeSignal5(riskData) {
  if (!riskData) {
    return {
      signal: 'Signal 5: Risk & Volatility Assessment',
      score: 0,
      label: 'No Data',
      explanation: 'Risk and volatility data is not available.',
      components: {},
    };
  }

  const explanations = [];
  let totalScore = 0;

  // --- Beta ---
  const { beta } = riskData;
  let betaScore = 0;

  if (beta <= 0.8) {
    betaScore = 0.5;
    explanations.push(
      `Beta of ${beta.toFixed(2)} indicates low market sensitivity — the stock is less volatile than the broader market.`
    );
  } else if (beta <= 1.2) {
    betaScore = 0.25;
    explanations.push(
      `Beta of ${beta.toFixed(2)} is near the market average — typical market sensitivity.`
    );
  } else if (beta <= 1.5) {
    betaScore = -0.25;
    explanations.push(
      `Beta of ${beta.toFixed(2)} is elevated — the stock amplifies market moves, adding portfolio risk.`
    );
  } else {
    betaScore = -0.5;
    explanations.push(
      `Beta of ${beta.toFixed(2)} is high — the stock is significantly more volatile than the market, demanding a risk premium.`
    );
  }
  totalScore += betaScore;

  // --- Historical Volatility ---
  const { historicalVolatility } = riskData;
  let volScore = 0;

  if (historicalVolatility <= 0.2) {
    volScore = 0.5;
    explanations.push(
      `Historical volatility of ${(historicalVolatility * 100).toFixed(0)}% is low — price action has been relatively stable.`
    );
  } else if (historicalVolatility <= 0.3) {
    volScore = 0.25;
    explanations.push(
      `Historical volatility of ${(historicalVolatility * 100).toFixed(0)}% is moderate — within normal range for an actively traded stock.`
    );
  } else if (historicalVolatility <= 0.45) {
    volScore = -0.25;
    explanations.push(
      `Historical volatility of ${(historicalVolatility * 100).toFixed(0)}% is elevated — expect larger price swings.`
    );
  } else {
    volScore = -0.5;
    explanations.push(
      `Historical volatility of ${(historicalVolatility * 100).toFixed(0)}% is high — significant price uncertainty and wide trading ranges.`
    );
  }
  totalScore += volScore;

  // --- Max Drawdown ---
  const { maxDrawdown } = riskData;
  let drawdownScore = 0;
  const drawdownPct = Math.abs(maxDrawdown) * 100;

  if (drawdownPct <= 15) {
    drawdownScore = 0.5;
    explanations.push(
      `Max drawdown of -${drawdownPct.toFixed(0)}% is contained — the stock has held up well during selloffs.`
    );
  } else if (drawdownPct <= 25) {
    drawdownScore = 0;
    explanations.push(
      `Max drawdown of -${drawdownPct.toFixed(0)}% is moderate — within expectations for the asset class.`
    );
  } else if (drawdownPct <= 40) {
    drawdownScore = -0.25;
    explanations.push(
      `Max drawdown of -${drawdownPct.toFixed(0)}% is significant — the stock has experienced notable peak-to-trough declines.`
    );
  } else {
    drawdownScore = -0.5;
    explanations.push(
      `Max drawdown of -${drawdownPct.toFixed(0)}% is severe — the stock has experienced deep selloffs, indicating high tail risk.`
    );
  }
  totalScore += drawdownScore;

  // --- Debt-to-Equity ---
  const { debtToEquity } = riskData;
  let debtScore = 0;

  if (debtToEquity <= 0.3) {
    debtScore = 0.5;
    explanations.push(
      `Debt-to-equity of ${debtToEquity.toFixed(2)} is very low — strong balance sheet with minimal leverage.`
    );
  } else if (debtToEquity <= 0.8) {
    debtScore = 0.25;
    explanations.push(
      `Debt-to-equity of ${debtToEquity.toFixed(2)} is moderate — manageable leverage relative to equity.`
    );
  } else if (debtToEquity <= 1.5) {
    debtScore = -0.25;
    explanations.push(
      `Debt-to-equity of ${debtToEquity.toFixed(2)} is elevated — meaningful financial leverage that could amplify downside risk.`
    );
  } else {
    debtScore = -0.5;
    explanations.push(
      `Debt-to-equity of ${debtToEquity.toFixed(2)} is high — significant leverage raises concerns about financial flexibility.`
    );
  }
  totalScore += debtScore;

  // Clamp to [-2, 2]
  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Low Risk';
  else if (finalScore >= 0.5) label = 'Moderate-Low Risk';
  else if (finalScore > -0.5) label = 'Moderate Risk';
  else if (finalScore > -1.5) label = 'Elevated Risk';
  else label = 'High Risk';

  return {
    signal: 'Signal 5: Risk & Volatility Assessment',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      beta,
      historicalVolatility,
      maxDrawdown,
      debtToEquity,
      betaScore,
      volScore,
      drawdownScore,
      debtScore,
    },
  };
}
