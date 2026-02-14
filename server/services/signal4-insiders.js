// Signal 4: Insider & Institutional Activity
// Scores based on net insider buying/selling, institutional ownership level, and ownership changes

export function analyzeSignal4(insiderData) {
  if (!insiderData) {
    return {
      signal: 'Signal 4: Insider & Institutional Activity',
      score: 0,
      label: 'No Data',
      explanation: 'Insider and institutional ownership data is not available.',
      components: {},
    };
  }

  // ETF branch: detected by netFlows30d field
  if (insiderData.netFlows30d != null) {
    return analyzeEtfFlows(insiderData);
  }

  const explanations = [];
  let totalScore = 0;

  // --- Net Insider Buying/Selling ---
  const transactions = insiderData.insiderTransactions || [];
  let totalBuys = 0;
  let totalSells = 0;

  for (const txn of transactions) {
    if (txn.type === 'buy') totalBuys += txn.value;
    else if (txn.type === 'sell') totalSells += txn.value;
  }

  // Buying is weighted 2x since selling has many non-signal reasons (tax, diversification, etc.)
  const netSignal = totalBuys * 2 - totalSells;
  let insiderScore = 0;

  if (totalBuys > 0 && totalBuys * 2 > totalSells) {
    insiderScore = 0.75;
    explanations.push(
      `Net insider buying: $${(totalBuys / 1e6).toFixed(1)}M in purchases vs $${(totalSells / 1e6).toFixed(1)}M in sales — insiders are putting their money in, a bullish signal.`
    );
  } else if (totalBuys > 0 && totalSells > 0) {
    insiderScore = 0;
    explanations.push(
      `Mixed insider activity: $${(totalBuys / 1e6).toFixed(1)}M in purchases vs $${(totalSells / 1e6).toFixed(1)}M in sales — no clear conviction signal.`
    );
  } else if (totalSells > 10000000) {
    insiderScore = -0.5;
    explanations.push(
      `Heavy insider selling: $${(totalSells / 1e6).toFixed(1)}M in recent sales with minimal buying — may indicate insider caution.`
    );
  } else if (totalSells > 0) {
    insiderScore = -0.25;
    explanations.push(
      `Moderate insider selling: $${(totalSells / 1e6).toFixed(1)}M in recent sales — common for executives but worth noting.`
    );
  } else {
    explanations.push('No recent insider transactions detected.');
  }
  totalScore += insiderScore;

  // --- Institutional Ownership Level ---
  const instOwn = insiderData.institutionalOwnership;
  let ownershipScore = 0;

  if (instOwn != null) {
    if (instOwn > 0.7) {
      ownershipScore = 0.5;
      explanations.push(
        `Institutional ownership at ${(instOwn * 100).toFixed(0)}% — strong institutional backing and broad coverage.`
      );
    } else if (instOwn > 0.5) {
      ownershipScore = 0.25;
      explanations.push(
        `Institutional ownership at ${(instOwn * 100).toFixed(0)}% — moderate institutional interest.`
      );
    } else if (instOwn > 0.3) {
      ownershipScore = 0;
      explanations.push(
        `Institutional ownership at ${(instOwn * 100).toFixed(0)}% — below average institutional coverage.`
      );
    } else {
      ownershipScore = -0.5;
      explanations.push(
        `Institutional ownership at ${(instOwn * 100).toFixed(0)}% — thin institutional support, higher retail concentration.`
      );
    }
  }
  totalScore += ownershipScore;

  // --- Institutional Ownership Change (QoQ) ---
  const instOwnPrior = insiderData.institutionalOwnershipPrior;
  let ownershipChangeScore = 0;

  if (instOwn != null && instOwnPrior != null) {
    const changePct = (instOwn - instOwnPrior) * 100;

    if (changePct > 3) {
      ownershipChangeScore = 0.5;
      explanations.push(
        `Institutional accumulation: ownership up ${changePct.toFixed(1)}pp quarter-over-quarter — institutions are adding positions.`
      );
    } else if (changePct > 1) {
      ownershipChangeScore = 0.25;
      explanations.push(
        `Modest institutional accumulation: ownership up ${changePct.toFixed(1)}pp quarter-over-quarter.`
      );
    } else if (changePct < -3) {
      ownershipChangeScore = -0.5;
      explanations.push(
        `Institutional reduction: ownership down ${Math.abs(changePct).toFixed(1)}pp quarter-over-quarter — institutions are trimming positions.`
      );
    } else if (changePct < -1) {
      ownershipChangeScore = -0.25;
      explanations.push(
        `Modest institutional reduction: ownership down ${Math.abs(changePct).toFixed(1)}pp quarter-over-quarter.`
      );
    } else {
      explanations.push(
        `Institutional ownership stable (${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}pp change) — no significant shift.`
      );
    }
  }
  totalScore += ownershipChangeScore;

  // Clamp to [-2, 2]
  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 4: Insider & Institutional Activity',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      insiderBuys: totalBuys,
      insiderSells: totalSells,
      netSignal,
      institutionalOwnership: instOwn,
      institutionalOwnershipPrior: instOwnPrior,
      ownershipChangePct: instOwn != null && instOwnPrior != null ? +((instOwn - instOwnPrior) * 100).toFixed(1) : null,
      insiderScore,
      ownershipScore,
      ownershipChangeScore,
    },
  };
}

// --- ETF Fund Flows & Holdings ---
function analyzeEtfFlows(insiderData) {
  const explanations = [];
  let totalScore = 0;

  // 30-day net flows
  let flowScore30 = 0;
  const flows30M = insiderData.netFlows30d / 1e6;
  if (flows30M > 500) {
    flowScore30 = 0.75;
    explanations.push(`Strong 30-day net inflows of $${(flows30M / 1000).toFixed(1)}B — institutional demand is surging.`);
  } else if (flows30M > 50) {
    flowScore30 = 0.5;
    explanations.push(`Positive 30-day net inflows of $${flows30M.toFixed(0)}M — steady demand from investors.`);
  } else if (flows30M > -50) {
    flowScore30 = 0;
    explanations.push(`30-day flows are roughly flat ($${flows30M.toFixed(0)}M) — balanced creation and redemption.`);
  } else if (flows30M > -500) {
    flowScore30 = -0.5;
    explanations.push(`30-day net outflows of $${Math.abs(flows30M).toFixed(0)}M — investors are pulling capital.`);
  } else {
    flowScore30 = -0.75;
    explanations.push(`Heavy 30-day net outflows of $${(Math.abs(flows30M) / 1000).toFixed(1)}B — significant redemption pressure.`);
  }
  totalScore += flowScore30;

  // Creation/Redemption Ratio
  let crScore = 0;
  const crRatio = insiderData.creationRedemptionRatio;
  if (crRatio >= 1.3) {
    crScore = 0.5;
    explanations.push(`Creation/redemption ratio of ${crRatio.toFixed(2)} shows strong net creation activity — authorized participants see demand.`);
  } else if (crRatio >= 1.1) {
    crScore = 0.25;
    explanations.push(`Creation/redemption ratio of ${crRatio.toFixed(2)} shows modest net creation — healthy demand signal.`);
  } else if (crRatio >= 0.9) {
    crScore = 0;
    explanations.push(`Creation/redemption ratio of ${crRatio.toFixed(2)} is balanced — no strong directional signal.`);
  } else if (crRatio >= 0.75) {
    crScore = -0.25;
    explanations.push(`Creation/redemption ratio of ${crRatio.toFixed(2)} shows net redemptions — soft demand.`);
  } else {
    crScore = -0.5;
    explanations.push(`Creation/redemption ratio of ${crRatio.toFixed(2)} shows heavy net redemptions — significant selling pressure.`);
  }
  totalScore += crScore;

  // Flow Acceleration (30d vs 90d trend)
  let accelScore = 0;
  const flows90M = insiderData.netFlows90d / 1e6;
  const avgMonthly90 = flows90M / 3;
  if (avgMonthly90 !== 0) {
    const accelRatio = flows30M / avgMonthly90;
    if (accelRatio > 1.5 && flows30M > 0) {
      accelScore = 0.5;
      explanations.push(`Flow acceleration: 30-day pace is ${accelRatio.toFixed(1)}x the 90-day average — demand is intensifying.`);
    } else if (accelRatio > 1.1 && flows30M > 0) {
      accelScore = 0.25;
      explanations.push(`Flows modestly accelerating vs 90-day trend — building momentum.`);
    } else if (accelRatio < 0.5 && flows30M < 0) {
      accelScore = -0.5;
      explanations.push(`Outflows accelerating: 30-day pace exceeds the 90-day trend — sentiment deteriorating.`);
    } else if (accelRatio < 0.8 && flows30M < avgMonthly90) {
      accelScore = -0.25;
      explanations.push(`Flows decelerating vs 90-day average — momentum fading.`);
    } else {
      explanations.push(`Flow pace is consistent with the 90-day trend — no significant acceleration or deceleration.`);
    }
  }
  totalScore += accelScore;

  const finalScore = Math.max(-2, Math.min(2, Math.round(totalScore * 2) / 2));

  let label;
  if (finalScore >= 1.5) label = 'Strong Bullish';
  else if (finalScore >= 0.5) label = 'Bullish';
  else if (finalScore > -0.5) label = 'Neutral';
  else if (finalScore > -1.5) label = 'Bearish';
  else label = 'Strong Bearish';

  return {
    signal: 'Signal 4: Fund Flows & Holdings',
    score: finalScore,
    label,
    explanation: explanations.join(' '),
    components: {
      netFlows30d: insiderData.netFlows30d,
      netFlows90d: insiderData.netFlows90d,
      creationRedemptionRatio: crRatio,
      flows30dMillions: +flows30M.toFixed(0),
      flows90dMillions: +flows90M.toFixed(0),
      flowScore30,
      crScore,
      accelScore,
    },
  };
}
