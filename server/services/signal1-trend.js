// Signal 1: Price Trend & Momentum
// Computes SMA, RSI, MACD, and volume analysis to produce a composite score

function computeSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, p) => acc + p.close, 0);
  return sum / period;
}

function computeRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  const changes = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (const change of changes) {
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeEMA(values, period) {
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function computeMACD(prices) {
  if (prices.length < 35) return null;
  const closes = prices.map((p) => p.close);

  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine = ema12 - ema26;

  // Compute MACD line for signal line calculation
  const macdValues = [];
  let ema12Running = closes[0];
  let ema26Running = closes[0];
  const k12 = 2 / 13;
  const k26 = 2 / 27;

  for (let i = 1; i < closes.length; i++) {
    ema12Running = closes[i] * k12 + ema12Running * (1 - k12);
    ema26Running = closes[i] * k26 + ema26Running * (1 - k26);
    macdValues.push(ema12Running - ema26Running);
  }

  const signalLine = computeEMA(macdValues.slice(-9), 9);
  const histogram = macdValues[macdValues.length - 1] - signalLine;

  return { macdLine: macdValues[macdValues.length - 1], signalLine, histogram };
}

function computeVolumeAnalysis(prices) {
  if (prices.length < 21) return null;
  const recent5 = prices.slice(-5);
  const avg20 = prices.slice(-21, -1).reduce((s, p) => s + p.volume, 0) / 20;
  const recentAvg = recent5.reduce((s, p) => s + p.volume, 0) / 5;
  return { recentAvg, avg20, ratio: recentAvg / avg20 };
}

export function analyzeSignal1(prices) {
  if (!prices || prices.length < 50) {
    return {
      signal: 'Signal 1: Price Trend & Momentum',
      score: 0,
      label: 'Insufficient Data',
      explanation: 'Not enough price history to compute trend indicators.',
      components: {},
    };
  }

  const currentPrice = prices[prices.length - 1].close;
  const components = {};
  let totalScore = 0;
  const explanations = [];

  // --- SMA Analysis ---
  const sma50 = computeSMA(prices, 50);
  const sma200 = computeSMA(prices, 200);
  components.sma50 = sma50 ? +sma50.toFixed(2) : null;
  components.sma200 = sma200 ? +sma200.toFixed(2) : null;
  components.currentPrice = currentPrice;

  let smaScore = 0;
  if (sma50 && sma200) {
    if (currentPrice > sma50 && sma50 > sma200) {
      smaScore = 1;
      explanations.push(
        `Price ($${currentPrice.toFixed(2)}) is above both the 50-day SMA ($${sma50.toFixed(2)}) and 200-day SMA ($${sma200.toFixed(2)}), with the 50 above the 200 — a bullish alignment.`
      );
    } else if (currentPrice < sma50 && sma50 < sma200) {
      smaScore = -1;
      explanations.push(
        `Price ($${currentPrice.toFixed(2)}) is below both the 50-day SMA ($${sma50.toFixed(2)}) and 200-day SMA ($${sma200.toFixed(2)}), with the 50 below the 200 — a bearish alignment.`
      );
    } else {
      explanations.push(
        `Mixed SMA signals: price is ${currentPrice > sma50 ? 'above' : 'below'} the 50-day SMA ($${sma50.toFixed(2)}) and ${currentPrice > sma200 ? 'above' : 'below'} the 200-day SMA ($${sma200.toFixed(2)}).`
      );
    }
  } else if (sma50) {
    if (currentPrice > sma50) {
      smaScore = 0.5;
      explanations.push(`Price is above the 50-day SMA ($${sma50.toFixed(2)}) — mildly bullish.`);
    } else {
      smaScore = -0.5;
      explanations.push(`Price is below the 50-day SMA ($${sma50.toFixed(2)}) — mildly bearish.`);
    }
  }
  components.smaScore = smaScore;
  totalScore += smaScore;

  // --- RSI Analysis ---
  const rsi = computeRSI(prices);
  components.rsi = rsi ? +rsi.toFixed(1) : null;

  let rsiScore = 0;
  if (rsi !== null) {
    if (rsi > 70) {
      rsiScore = -0.5;
      explanations.push(`RSI at ${rsi.toFixed(1)} indicates overbought conditions — caution on further upside.`);
    } else if (rsi < 30) {
      rsiScore = 0.5;
      explanations.push(`RSI at ${rsi.toFixed(1)} indicates oversold conditions — potential bounce opportunity.`);
    } else if (rsi > 55) {
      rsiScore = 0.25;
      explanations.push(`RSI at ${rsi.toFixed(1)} shows moderate bullish momentum.`);
    } else if (rsi < 45) {
      rsiScore = -0.25;
      explanations.push(`RSI at ${rsi.toFixed(1)} shows moderate bearish momentum.`);
    } else {
      explanations.push(`RSI at ${rsi.toFixed(1)} is neutral — no clear momentum signal.`);
    }
  }
  components.rsiScore = rsiScore;
  totalScore += rsiScore;

  // --- MACD Analysis ---
  const macd = computeMACD(prices);
  components.macd = macd;

  let macdScore = 0;
  if (macd) {
    if (macd.histogram > 0 && macd.macdLine > 0) {
      macdScore = 0.5;
      explanations.push(`MACD is positive (${macd.macdLine.toFixed(2)}) with bullish histogram (${macd.histogram.toFixed(2)}) — upward momentum confirmed.`);
    } else if (macd.histogram < 0 && macd.macdLine < 0) {
      macdScore = -0.5;
      explanations.push(`MACD is negative (${macd.macdLine.toFixed(2)}) with bearish histogram (${macd.histogram.toFixed(2)}) — downward momentum confirmed.`);
    } else if (macd.histogram > 0) {
      macdScore = 0.25;
      explanations.push(`MACD histogram is turning positive (${macd.histogram.toFixed(2)}) — potential bullish crossover.`);
    } else {
      macdScore = -0.25;
      explanations.push(`MACD histogram is turning negative (${macd.histogram.toFixed(2)}) — potential bearish crossover.`);
    }
  }
  components.macdScore = macdScore;
  totalScore += macdScore;

  // --- Volume Analysis ---
  const vol = computeVolumeAnalysis(prices);
  components.volume = vol;

  // Volume confirms direction but doesn't set it
  // We'll use it as a minor modifier — only if trend direction is clear
  if (vol && Math.abs(totalScore) > 0.25) {
    if (vol.ratio > 1.3) {
      explanations.push(`Recent volume is ${((vol.ratio - 1) * 100).toFixed(0)}% above the 20-day average — strong participation confirms the trend.`);
    } else if (vol.ratio < 0.7) {
      explanations.push(`Recent volume is ${((1 - vol.ratio) * 100).toFixed(0)}% below the 20-day average — weak participation, trend conviction is lower.`);
    }
  }

  // Clamp score to [-2, 2]
  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 1: Price Trend & Momentum',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components,
  };
}
