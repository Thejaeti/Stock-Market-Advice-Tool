import { getApiKey } from '../routes/settings.js';
import { getMockData } from '../mock/mockData.js';
import { getEtfMockData, isEtfTicker } from '../mock/etfMockData.js';
import * as cache from '../cache.js';

const BASE_URL = 'https://www.alphavantage.co/query';

async function fetchFromAV(params) {
  const apiKey = getApiKey('alphaVantage');
  if (!apiKey) return null;

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

    cache.set(cacheKey, prices);
    return prices;
  }

  // Fallback to mock data (stocks then ETFs)
  const mock = getMockData(ticker);
  if (mock) return mock.priceHistory;
  const etfMock = getEtfMockData(ticker);
  return etfMock ? etfMock.priceHistory : null;
}

export async function getCompanyOverview(ticker) {
  const cacheKey = `overview:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchFromAV({
    function: 'OVERVIEW',
    symbol: ticker,
  });

  if (data && data.Symbol) {
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
    };
    cache.set(cacheKey, overview);
    return overview;
  }

  // Fallback to mock data (stocks then ETFs)
  const mock = getMockData(ticker);
  if (mock) return mock.overview;
  const etfMock = getEtfMockData(ticker);
  return etfMock ? etfMock.overview : null;
}

export async function getAnalystData(ticker) {
  const cacheKey = `analyst:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // No direct AV endpoint for this — use mock data
  const mock = getMockData(ticker);
  if (mock) return mock.analystData;
  const etfMock = getEtfMockData(ticker);
  return etfMock ? etfMock.analystData : null;
}

export async function getInsiderData(ticker) {
  const cacheKey = `insider:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // No direct AV endpoint for this — use mock data
  const mock = getMockData(ticker);
  if (mock) return mock.insiderData;
  const etfMock = getEtfMockData(ticker);
  return etfMock ? etfMock.insiderData : null;
}

export async function getRiskData(ticker) {
  const cacheKey = `risk:${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // No direct AV endpoint for this — use mock data
  const mock = getMockData(ticker);
  if (mock) return mock.riskData;
  const etfMock = getEtfMockData(ticker);
  return etfMock ? etfMock.riskData : null;
}

export function isUsingMockData() {
  return !getApiKey('alphaVantage');
}

export function getAssetType(ticker) {
  return isEtfTicker(ticker) ? 'etf' : 'stock';
}
