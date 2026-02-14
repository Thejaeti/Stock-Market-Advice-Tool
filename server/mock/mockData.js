// Generate realistic mock price data for development
export function generatePriceHistory(basePrice, volatility, trend, days = 200) {
  const prices = [];
  let price = basePrice * (1 - trend * days * 0.001);
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48 + trend * 0.01) * volatility;
    price = price * (1 + change / 100);
    prices.push({
      date: date.toISOString().split('T')[0],
      open: +(price * (1 - Math.random() * 0.005)).toFixed(2),
      high: +(price * (1 + Math.random() * 0.015)).toFixed(2),
      low: +(price * (1 - Math.random() * 0.015)).toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(40000000 + Math.random() * 60000000),
    });
  }
  return prices;
}

const mockTickers = {
  AAPL: {
    overview: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 2900000000000,
      peRatio: 28.5,
      psRatio: 7.8,
      pfcfRatio: 26.2,
      dividendYield: 0.55,
      eps: 6.42,
      revenueGrowth: 0.08,
      earningsGrowth: 0.11,
    },
    priceHistory: generatePriceHistory(182, 1.5, 0.3),
    analystData: {
      ratings: { buy: 28, hold: 8, sell: 2 },
      currentPrice: 182,
      medianTarget: 205,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 1.65, estimate: 1.58 },
        { quarter: 'Q4 2024', actual: 2.18, estimate: 2.11 },
        { quarter: 'Q3 2024', actual: 1.46, estimate: 1.39 },
        { quarter: 'Q2 2024', actual: 1.40, estimate: 1.35 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 5200000, date: '2025-01-15' },
        { type: 'sell', value: 3100000, date: '2024-12-10' },
        { type: 'buy', value: 250000, date: '2024-11-20' },
      ],
      institutionalOwnership: 0.74,
      institutionalOwnershipPrior: 0.72,
    },
    riskData: {
      beta: 1.19,
      historicalVolatility: 0.24,
      maxDrawdown: -0.18,
      debtToEquity: 1.76,
    },
  },
  MSFT: {
    overview: {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software - Infrastructure',
      marketCap: 3100000000000,
      peRatio: 35.2,
      psRatio: 13.1,
      pfcfRatio: 42.8,
      dividendYield: 0.72,
      eps: 11.07,
      revenueGrowth: 0.16,
      earningsGrowth: 0.22,
    },
    priceHistory: generatePriceHistory(378, 1.8, 0.5),
    analystData: {
      ratings: { buy: 35, hold: 5, sell: 1 },
      currentPrice: 378,
      medianTarget: 430,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 3.12, estimate: 2.94 },
        { quarter: 'Q4 2024', actual: 2.93, estimate: 2.78 },
        { quarter: 'Q3 2024', actual: 2.99, estimate: 2.82 },
        { quarter: 'Q2 2024', actual: 2.69, estimate: 2.55 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 8500000, date: '2025-01-20' },
        { type: 'buy', value: 1200000, date: '2024-12-15' },
        { type: 'buy', value: 900000, date: '2024-11-05' },
      ],
      institutionalOwnership: 0.73,
      institutionalOwnershipPrior: 0.70,
    },
    riskData: {
      beta: 0.89,
      historicalVolatility: 0.21,
      maxDrawdown: -0.15,
      debtToEquity: 0.42,
    },
  },
  GOOGL: {
    overview: {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      sector: 'Technology',
      industry: 'Internet Content & Information',
      marketCap: 1900000000000,
      peRatio: 24.1,
      psRatio: 6.2,
      pfcfRatio: 23.5,
      dividendYield: 0.0,
      eps: 5.80,
      revenueGrowth: 0.13,
      earningsGrowth: 0.18,
    },
    priceHistory: generatePriceHistory(140, 2.0, 0.2),
    analystData: {
      ratings: { buy: 30, hold: 10, sell: 3 },
      currentPrice: 140,
      medianTarget: 165,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 1.91, estimate: 1.82 },
        { quarter: 'Q4 2024', actual: 1.64, estimate: 1.59 },
        { quarter: 'Q3 2024', actual: 1.55, estimate: 1.45 },
        { quarter: 'Q2 2024', actual: 1.44, estimate: 1.38 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 12000000, date: '2025-01-08' },
        { type: 'sell', value: 6500000, date: '2024-12-01' },
        { type: 'sell', value: 4200000, date: '2024-10-22' },
      ],
      institutionalOwnership: 0.65,
      institutionalOwnershipPrior: 0.64,
    },
    riskData: {
      beta: 1.06,
      historicalVolatility: 0.27,
      maxDrawdown: -0.22,
      debtToEquity: 0.10,
    },
  },
  TSLA: {
    overview: {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      marketCap: 780000000000,
      peRatio: 62.5,
      psRatio: 8.1,
      pfcfRatio: 95.3,
      dividendYield: 0.0,
      eps: 3.91,
      revenueGrowth: 0.19,
      earningsGrowth: -0.05,
    },
    priceHistory: generatePriceHistory(245, 3.5, -0.1),
    analystData: {
      ratings: { buy: 12, hold: 15, sell: 14 },
      currentPrice: 245,
      medianTarget: 198,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 0.85, estimate: 0.95 },
        { quarter: 'Q4 2024', actual: 0.71, estimate: 0.78 },
        { quarter: 'Q3 2024', actual: 0.72, estimate: 0.60 },
        { quarter: 'Q2 2024', actual: 0.52, estimate: 0.62 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 22000000, date: '2025-01-10' },
        { type: 'sell', value: 15000000, date: '2024-11-28' },
        { type: 'sell', value: 9000000, date: '2024-10-15' },
      ],
      institutionalOwnership: 0.44,
      institutionalOwnershipPrior: 0.48,
    },
    riskData: {
      beta: 2.05,
      historicalVolatility: 0.55,
      maxDrawdown: -0.42,
      debtToEquity: 0.69,
    },
  },
  AMZN: {
    overview: {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail',
      marketCap: 1850000000000,
      peRatio: 58.3,
      psRatio: 3.1,
      pfcfRatio: 48.2,
      dividendYield: 0.0,
      eps: 3.17,
      revenueGrowth: 0.12,
      earningsGrowth: 0.35,
    },
    priceHistory: generatePriceHistory(178, 2.2, 0.4),
    analystData: {
      ratings: { buy: 38, hold: 4, sell: 1 },
      currentPrice: 178,
      medianTarget: 215,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 1.12, estimate: 0.98 },
        { quarter: 'Q4 2024', actual: 1.29, estimate: 1.15 },
        { quarter: 'Q3 2024', actual: 0.94, estimate: 0.91 },
        { quarter: 'Q2 2024', actual: 1.26, estimate: 1.03 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 4800000, date: '2025-01-12' },
        { type: 'buy', value: 2100000, date: '2024-12-05' },
        { type: 'buy', value: 1500000, date: '2024-11-10' },
      ],
      institutionalOwnership: 0.63,
      institutionalOwnershipPrior: 0.60,
    },
    riskData: {
      beta: 1.14,
      historicalVolatility: 0.29,
      maxDrawdown: -0.20,
      debtToEquity: 0.83,
    },
  },
  META: {
    overview: {
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      sector: 'Technology',
      industry: 'Internet Content & Information',
      marketCap: 1300000000000,
      peRatio: 29.8,
      psRatio: 9.5,
      pfcfRatio: 24.1,
      dividendYield: 0.36,
      eps: 17.41,
      revenueGrowth: 0.22,
      earningsGrowth: 0.65,
    },
    priceHistory: generatePriceHistory(505, 2.8, 0.6),
    analystData: {
      ratings: { buy: 42, hold: 6, sell: 2 },
      currentPrice: 505,
      medianTarget: 570,
      earningsSurprises: [
        { quarter: 'Q1 2025', actual: 5.28, estimate: 4.71 },
        { quarter: 'Q4 2024', actual: 5.33, estimate: 4.96 },
        { quarter: 'Q3 2024', actual: 4.39, estimate: 3.88 },
        { quarter: 'Q2 2024', actual: 5.16, estimate: 4.73 },
      ],
    },
    insiderData: {
      insiderTransactions: [
        { type: 'sell', value: 18000000, date: '2025-01-18' },
        { type: 'sell', value: 7500000, date: '2024-12-20' },
        { type: 'buy', value: 500000, date: '2024-10-30' },
      ],
      institutionalOwnership: 0.78,
      institutionalOwnershipPrior: 0.75,
    },
    riskData: {
      beta: 1.32,
      historicalVolatility: 0.35,
      maxDrawdown: -0.25,
      debtToEquity: 0.31,
    },
  },
};

export function getMockData(ticker) {
  return mockTickers[ticker.toUpperCase()] || null;
}

export function getMockTickers() {
  return Object.keys(mockTickers);
}
