import { getApiKey } from '../routes/settings.js';
import { getMockData } from '../mock/mockData.js';
import { getEtfMockData, isEtfTicker } from '../mock/etfMockData.js';
import * as cache from '../cache.js';
import { acquireSlot } from '../rateLimiter.js';

const BASE_URL = 'https://www.alphavantage.co/query';
const overviewInFlight = new Map();

async function fetchFromAV(params) {
  const apiKey = getApiKey('alphaVantage');
  if (!apiKey) return null;

  const allowed = await acquireSlot();
  if (!allowed) {
    console.warn('AV daily rate limit reached, falling back to mock data');
    return null;
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', apiKey);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  if (data['Error Message'] || data['Note']) return null;
  return data;
}

export async function getDailyPrices(ticker) {
  const cacheKey = `prices:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchFromAV({
    function: 'TIME_SERIES_DAILY',
    symbol: ticker,
    outputsize: 'compact',
  });

  if (data && data['Time Series (Daily)']) {
    const timeSeries = data['Time Series (Daily)'];
    const prices = Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    prices._source = 'live';
    cache.set(cacheKey, prices);
    return prices;
  }

  // Fallback to mock data (stocks then ETFs)
  const mock = getMockData(ticker);
  if (mock) { mock.priceHistory._source = 'mock'; return mock.priceHistory; }
  const etfMock = getEtfMockData(ticker);
  if (etfMock) { etfMock.priceHistory._source = 'mock'; return etfMock.priceHistory; }
  return null;
}

async function fetchRawOverview(ticker) {
  const cacheKey = `raw-overview:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Deduplicate concurrent in-flight requests for the same ticker
  if (overviewInFlight.has(ticker)) {
    return overviewInFlight.get(ticker);
  }

  const promise = (async () => {
    const data = await fetchFromAV({
      function: 'OVERVIEW',
      symbol: ticker,
    });

    if (data && data.Symbol) {
      cache.set(cacheKey, data);
      return data;
    }
    return null;
  })();

  overviewInFlight.set(ticker, promise);
  try {
    return await promise;
  } finally {
    overviewInFlight.delete(ticker);
  }
}

function fiscalDateToQuarter(dateStr) {
  const [, month] = dateStr.split('-').map(Number);
  const quarter = Math.ceil(month / 3);
  const year = dateStr.split('-')[0];
  return `Q${quarter} ${year}`;
}

export async function getCompanyOverview(ticker) {
  const cacheKey = `overview:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchRawOverview(ticker);

  if (data) {
    const overview = {
      symbol: data.Symbol,
      name: data.Name,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: parseFloat(data.MarketCapitalization),
      peRatio: parseFloat(data.PERatio) || 0,
      psRatio: parseFloat(data.PriceToSalesRatioTTM) || 0,
      pfcfRatio: parseFloat(data.PriceToFreeCashFlowsTTM) || 0,
      dividendYield: parseFloat(data.DividendYield) * 100 || 0,
      eps: parseFloat(data.EPS) || 0,
      revenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || 0,
      earningsGrowth: parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
      _source: 'live',
    };
    cache.set(cacheKey, overview);
    return overview;
  }

  // Fallback to mock data (stocks then ETFs)
  const mock = getMockData(ticker);
  if (mock) return { ...mock.overview, _source: 'mock' };
  const etfMock = getEtfMockData(ticker);
  return etfMock ? { ...etfMock.overview, _source: 'mock' } : null;
}

export async function getAnalystData(ticker) {
  const cacheKey = `analyst:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const overview = await fetchRawOverview(ticker);

  if (overview && overview.AnalystTargetPrice) {
    const buy = (parseInt(overview.AnalystRatingStrongBuy) || 0) + (parseInt(overview.AnalystRatingBuy) || 0);
    const hold = parseInt(overview.AnalystRatingHold) || 0;
    const sell = (parseInt(overview.AnalystRatingSell) || 0) + (parseInt(overview.AnalystRatingStrongSell) || 0);
    const medianTarget = parseFloat(overview.AnalystTargetPrice) || 0;

    let earningsSurprises = [];
    const earningsData = await fetchFromAV({ function: 'EARNINGS', symbol: ticker });
    if (earningsData && earningsData.quarterlyEarnings) {
      earningsSurprises = earningsData.quarterlyEarnings.slice(0, 4).map(q => ({
        quarter: fiscalDateToQuarter(q.fiscalDateEnding),
        actual: parseFloat(q.reportedEPS) || 0,
        estimate: parseFloat(q.estimatedEPS) || 0,
      }));
    }

    const result = {
      ratings: { buy, hold, sell },
      currentPrice: null,
      medianTarget,
      earningsSurprises,
      _source: 'live',
    };
    cache.set(cacheKey, result);
    return result;
  }

  // Fallback to mock data
  const mock = getMockData(ticker);
  if (mock) return { ...mock.analystData, _source: 'mock' };
  const etfMock = getEtfMockData(ticker);
  return etfMock ? { ...etfMock.analystData, _source: 'mock' } : null;
}

export async function getInsiderData(ticker) {
  const cacheKey = `insider:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Try Finnhub for stock insider transactions
  const finnhubKey = getApiKey('finnhub');
  if (finnhubKey && !isEtfTicker(ticker)) {
    try {
      const { getInsiderTransactions } = await import('./finnhub.js');
      const liveData = await getInsiderTransactions(ticker);
      if (liveData) {
        liveData._source = 'live';
        cache.set(cacheKey, liveData);
        return liveData;
      }
    } catch (err) {
      console.warn('Finnhub insider fetch failed, falling back to mock:', err.message);
    }
  }

  // Try Finnhub for ETF holdings (flows stay mock)
  if (finnhubKey && isEtfTicker(ticker)) {
    try {
      const { getEtfHoldings } = await import('./finnhub.js');
      const holdings = await getEtfHoldings(ticker);
      const etfMock = getEtfMockData(ticker);
      const base = etfMock?.insiderData || {};
      if (holdings) {
        const result = { ...base, topHoldings: holdings, _source: 'partial' };
        cache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('Finnhub ETF holdings fetch failed, falling back to mock:', err.message);
    }
  }

  // Fallback to mock data
  const mock = getMockData(ticker);
  if (mock) return { ...mock.insiderData, _source: 'mock' };
  const etfMock = getEtfMockData(ticker);
  return etfMock ? { ...etfMock.insiderData, _source: 'mock' } : null;
}

export async function getRiskData(ticker) {
  const cacheKey = `risk:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchRawOverview(ticker);

  if (data) {
    const beta = parseFloat(data.Beta);
    const result = {
      beta: isNaN(beta) ? null : beta,
      historicalVolatility: null,
      maxDrawdown: null,
      debtToEquity: null,
      _source: 'live',
    };
    cache.set(cacheKey, result);
    return result;
  }

  // Fallback to mock data (stocks then ETFs)
  const mock = getMockData(ticker);
  if (mock) return { ...mock.riskData, _source: 'mock' };
  const etfMock = getEtfMockData(ticker);
  return etfMock ? { ...etfMock.riskData, _source: 'mock' } : null;
}

export function isUsingMockData() {
  return !getApiKey('alphaVantage');
}

export function getAssetType(ticker) {
  return isEtfTicker(ticker) ? 'etf' : 'stock';
}
