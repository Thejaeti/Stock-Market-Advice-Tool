// Signal 3: Analyst & Earnings Sentiment
// Scores based on analyst consensus, price target upside/downside, and earnings surprise history

export function analyzeSignal3(analystData) {
  if (!analystData) {
    return {
      signal: 'Signal 3: Analyst & Earnings Sentiment',
      score: 0,
      label: 'No Data',
      explanation: 'Analyst and earnings data is not available.',
      components: {},
    };
  }

  // ETF branch: detected by morningstarRating field
  if (analystData.morningstarRating != null) {
    return analyzeEtfSentiment(analystData);
  }

  const explanations = [];
  let totalScore = 0;

  // --- Analyst Consensus ---
  const { buy, hold, sell } = analystData.ratings;
  const totalRatings = buy + hold + sell;
  const buyPct = totalRatings > 0 ? buy / totalRatings : 0;
  const sellPct = totalRatings > 0 ? sell / totalRatings : 0;

  let consensusScore = 0;
  if (buyPct > 0.75) {
    consensusScore = 1;
    explanations.push(
      `Strong analyst consensus: ${(buyPct * 100).toFixed(0)}% of ${totalRatings} analysts rate Buy — overwhelmingly bullish.`
    );
  } else if (buyPct > 0.6) {
    consensusScore = 0.5;
    explanations.push(
      `Positive analyst consensus: ${(buyPct * 100).toFixed(0)}% of ${totalRatings} analysts rate Buy — a solid majority.`
    );
  } else if (sellPct > 0.25) {
    consensusScore = -0.5;
    explanations.push(
      `Cautious analyst sentiment: ${(sellPct * 100).toFixed(0)}% of ${totalRatings} analysts rate Sell — notable bearish contingent.`
    );
  } else if (sellPct > 0.35) {
    consensusScore = -1;
    explanations.push(
      `Bearish analyst consensus: ${(sellPct * 100).toFixed(0)}% of ${totalRatings} analysts rate Sell — significant downgrade pressure.`
    );
  } else {
    explanations.push(
      `Mixed analyst consensus: ${(buyPct * 100).toFixed(0)}% Buy, ${(sellPct * 100).toFixed(0)}% Sell among ${totalRatings} analysts — no strong directional lean.`
    );
  }
  totalScore += consensusScore;

  // --- Price Target Analysis ---
  const { currentPrice, medianTarget } = analystData;
  let targetScore = 0;
  if (currentPrice > 0 && medianTarget > 0) {
    const upsidePct = ((medianTarget - currentPrice) / currentPrice) * 100;

    if (upsidePct > 20) {
      targetScore = 0.75;
      explanations.push(
        `Median price target of $${medianTarget} implies ${upsidePct.toFixed(1)}% upside — analysts see significant room to run.`
      );
    } else if (upsidePct > 5) {
      targetScore = 0.25;
      explanations.push(
        `Median price target of $${medianTarget} implies ${upsidePct.toFixed(1)}% upside — modest appreciation expected.`
      );
    } else if (upsidePct > -5) {
      explanations.push(
        `Median price target of $${medianTarget} is near current price (${upsidePct > 0 ? '+' : ''}${upsidePct.toFixed(1)}%) — analysts see fair value around here.`
      );
    } else if (upsidePct > -20) {
      targetScore = -0.5;
      explanations.push(
        `Median price target of $${medianTarget} implies ${upsidePct.toFixed(1)}% downside — analysts see the stock as overvalued.`
      );
    } else {
      targetScore = -1;
      explanations.push(
        `Median price target of $${medianTarget} implies ${upsidePct.toFixed(1)}% downside — analysts see significant overvaluation.`
      );
    }
  }
  totalScore += targetScore;

  // --- Earnings Surprises ---
  const surprises = analystData.earningsSurprises || [];
  let surpriseScore = 0;
  if (surprises.length > 0) {
    let totalSurprisePct = 0;
    let beats = 0;
    let misses = 0;

    for (const q of surprises) {
      const pct = ((q.actual - q.estimate) / Math.abs(q.estimate)) * 100;
      totalSurprisePct += pct;
      if (q.actual > q.estimate) beats++;
      else if (q.actual < q.estimate) misses++;
    }

    const avgSurprise = totalSurprisePct / surprises.length;

    if (beats >= 3 && avgSurprise > 5) {
      surpriseScore = 0.5;
      explanations.push(
        `Consistent earnings beats: ${beats}/${surprises.length} quarters beat estimates by an avg of ${avgSurprise.toFixed(1)}% — strong execution.`
      );
    } else if (beats > misses && avgSurprise > 0) {
      surpriseScore = 0.25;
      explanations.push(
        `Positive earnings track record: ${beats}/${surprises.length} beats with avg surprise of +${avgSurprise.toFixed(1)}%.`
      );
    } else if (misses >= 3 && avgSurprise < -5) {
      surpriseScore = -0.5;
      explanations.push(
        `Consistent earnings misses: ${misses}/${surprises.length} quarters missed estimates by an avg of ${avgSurprise.toFixed(1)}% — execution concerns.`
      );
    } else if (misses > beats) {
      surpriseScore = -0.25;
      explanations.push(
        `Negative earnings track record: ${misses}/${surprises.length} misses with avg surprise of ${avgSurprise.toFixed(1)}%.`
      );
    } else {
      explanations.push(
        `Mixed earnings track: ${beats} beats, ${misses} misses over ${surprises.length} quarters.`
      );
    }
  }
  totalScore += surpriseScore;

  // Clamp to [-2, 2]
  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 3: Analyst & Earnings Sentiment',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      ratings: analystData.ratings,
      buyPct: +(buyPct * 100).toFixed(1),
      sellPct: +(sellPct * 100).toFixed(1),
      medianTarget,
      currentPrice,
      targetUpsidePct: currentPrice > 0 ? +(((medianTarget - currentPrice) / currentPrice) * 100).toFixed(1) : null,
      earningsBeats: surprises.filter((q) => q.actual > q.estimate).length,
      earningsMisses: surprises.filter((q) => q.actual < q.estimate).length,
      consensusScore,
      targetScore,
      surpriseScore,
    },
  };
}

// --- ETF Rating & Sentiment ---
function analyzeEtfSentiment(analystData) {
  const explanations = [];
  let totalScore = 0;

  // Morningstar Rating (1-5 stars)
  let ratingScore = 0;
  const stars = analystData.morningstarRating;
  if (stars >= 5) {
    ratingScore = 1;
    explanations.push(`Morningstar 5-star rating — top-tier risk-adjusted performance in its category.`);
  } else if (stars >= 4) {
    ratingScore = 0.5;
    explanations.push(`Morningstar ${stars}-star rating — above-average risk-adjusted returns.`);
  } else if (stars >= 3) {
    ratingScore = 0;
    explanations.push(`Morningstar ${stars}-star rating — average performance within its peer group.`);
  } else if (stars >= 2) {
    ratingScore = -0.5;
    explanations.push(`Morningstar ${stars}-star rating — below-average risk-adjusted returns.`);
  } else {
    ratingScore = -1;
    explanations.push(`Morningstar ${stars}-star rating — poor risk-adjusted performance, bottom of category.`);
  }
  totalScore += ratingScore;

  // Category Percentile Rank (lower = better)
  let rankScore = 0;
  const rank = analystData.categoryRank;
  if (rank <= 10) {
    rankScore = 1;
    explanations.push(`Ranked in the top ${rank}th percentile of its category — elite performance.`);
  } else if (rank <= 25) {
    rankScore = 0.5;
    explanations.push(`Ranked in the ${rank}th percentile — solidly in the top quartile.`);
  } else if (rank <= 50) {
    rankScore = 0;
    explanations.push(`Ranked at the ${rank}th percentile — middle of the pack.`);
  } else if (rank <= 75) {
    rankScore = -0.5;
    explanations.push(`Ranked at the ${rank}th percentile — below median in its category.`);
  } else {
    rankScore = -1;
    explanations.push(`Ranked at the ${rank}th percentile — bottom quartile of its category.`);
  }
  totalScore += rankScore;

  // Net Inflows/Outflows (in millions)
  let flowScore = 0;
  const flows = analystData.inflowsOutflows;
  if (flows > 1000) {
    flowScore = 0.5;
    explanations.push(`Net inflows of $${flows.toLocaleString()}M signal strong investor conviction and growing demand.`);
  } else if (flows > 100) {
    flowScore = 0.25;
    explanations.push(`Net inflows of $${flows.toLocaleString()}M indicate positive sentiment among fund investors.`);
  } else if (flows > -100) {
    flowScore = 0;
    explanations.push(`Flows are roughly flat ($${flows.toLocaleString()}M) — neither strong conviction nor concern.`);
  } else if (flows > -500) {
    flowScore = -0.25;
    explanations.push(`Net outflows of $${Math.abs(flows).toLocaleString()}M suggest waning investor interest.`);
  } else {
    flowScore = -0.5;
    explanations.push(`Heavy net outflows of $${Math.abs(flows).toLocaleString()}M — investors are exiting the theme.`);
  }
  totalScore += flowScore;

  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 3: ETF Rating & Sentiment',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      morningstarRating: stars,
      categoryRank: rank,
      inflowsOutflows: flows,
      flowsTrend: analystData.flowsTrend,
      ratingScore,
      rankScore,
      flowScore,
    },
  };
}
