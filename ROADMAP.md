# Roadmap

## Completed
1. ~~Wire Signal 3 (Analyst & Earnings) to live Alpha Vantage data~~ — OVERVIEW + EARNINGS endpoints
2. ~~Wire Signal 5 (Risk & Volatility) to live data~~ — beta from OVERVIEW, volatility + drawdown computed from daily prices
3. ~~Persist API keys across server restarts~~ — server/data/settings.json, auto-created on first save
4. ~~Add rate-limit protection for AV free tier (5 calls/min, 25/day)~~ — server/rateLimiter.js, serialized promise chain

## Up Next
5. Wire Signal 4 (Insider Activity) via Finnhub (Settings UI already accepts Finnhub key)
6. Wire fund overlap to live ETF holdings data (currently uses hardcoded mock holdings; needs Finnhub or similar API)
7. Add test infrastructure (currently zero tests)
