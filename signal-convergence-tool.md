# Signal Convergence Investment Tool — Project Foundation Document

## Overview

This document captures the full context and requirements for building a browser-based investment analysis tool. The tool's core premise is that genuinely uncorrelated signals — derived from fundamentally different information sources — occasionally converge in agreement. When they do, the resulting directional indication is more meaningful than any single signal alone. The tool is designed for experimentation and learning, not high-stakes trading.

---

## Core Philosophy

### Why Signal Convergence?

Most retail technical analysis tools stack indicators that are all derived from the same underlying price data (RSI, MACD, moving averages, Bollinger Bands, etc.). When these agree, it feels like strong confirmation, but it's largely the same information expressed multiple ways. True convergence requires signals that come from fundamentally different sources — different market participants, different data types, different time horizons.

The tool should only suggest action when multiple truly independent signals align. Most of the time, the correct output is "no clear edge right now." The discipline of *not* acting when signals are mixed is arguably the tool's most valuable feature.

### Key Caveats the Tool Should Reflect

- **No signal combination guarantees profitability.** The tool is an experiment and a learning aid.
- **Overfitting is the silent killer.** Resist the urge to keep tuning parameters until historical results look perfect — that almost always collapses in live conditions.
- **Transaction costs matter at small scale.** Even with commission-free brokerages, bid-ask spreads on less liquid instruments can eat into small positions.
- **Backtesting is essential before trusting any signal combination.** Without historical validation, you're building a sophisticated gut feeling.
- **Risk management (position sizing, stop losses) matters more than signal quality** for long-term outcomes.

---

## The Five Signals

Each signal comes from a fundamentally different information source. Each gets a simple rating: **Bullish**, **Neutral**, or **Bearish**. The user should only consider acting when four or five signals lean the same direction with none actively contrary.

### Signal 1: Price Trend and Momentum

**What it represents:** What is the crowd currently doing?

**Information source:** Historical price and volume data for the specific ticker.

**Key principle:** Everything derived from the price chart should be collapsed into ONE composite signal. Do not let multiple price-derived indicators (RSI, MACD, moving averages, chart patterns) count as separate votes — they are different lenses on the same data.

**Components to compute:**
- Trend direction: Is price above or below its 50-day and 200-day moving averages? Are the moving averages in bullish or bearish alignment?
- Momentum: RSI (14-period). Above 70 = overbought, below 30 = oversold. Treat the middle zone as neutral.
- MACD: Is the MACD line above or below the signal line? Is the histogram expanding or contracting?
- Volume context: Is recent volume above or below its 20-day average? Rising price on rising volume is more convincing than rising price on declining volume.

**Composite scoring logic:**
- Bullish: Price above key MAs, RSI in 50-70 range (strong but not overbought), MACD bullish crossover or positive histogram, volume confirming.
- Bearish: Inverse of the above.
- Neutral: Mixed readings or price chopping sideways with no clear trend.

**Visual component:** The original concept for this tool included the idea of AI visual analysis of chart images. This could be incorporated as an optional layer — feeding a chart screenshot to a multimodal model for pattern recognition (head and shoulders, double bottoms, support/resistance, etc.). This is supplementary to the computed indicators, not a replacement. Both the visual and computed analysis should feed into this single composite signal.

**Data source:** Alpha Vantage free tier (daily price and volume data, plus built-in technical indicator endpoints for RSI, MACD, SMA, EMA).

---

### Signal 2: Fundamental Valuation Relative to Peers

**What it represents:** Does the current price make sense given the company's financials?

**Information source:** Accounting data and sector comparisons — fundamentally different from price action.

**Why it's uncorrelated with Signal 1:** A stock can be in a strong uptrend and still be cheap relative to peers (early re-rating) or in a strong uptrend and wildly expensive (late-stage momentum). Price action and valuation regularly diverge.

**Components to compute:**
- Price-to-Earnings (P/E) ratio relative to the sector median.
- Price-to-Sales (P/S) ratio relative to the sector median.
- Price-to-Free-Cash-Flow (P/FCF) if available.
- The goal is not deep fundamental analysis — it's a sanity check. Is this stock priced reasonably, or is the price detached from underlying business reality?

**Composite scoring logic:**
- Bullish: Valuation ratios are below the sector median (stock is relatively cheap for what it earns/generates).
- Bearish: Valuation ratios are significantly above the sector median (stock is priced for perfection).
- Neutral: Roughly in line with peers.

**Important nuance for ETFs/index funds:** This signal is most applicable to individual stocks. For broad ETFs, a modified version could compare the index's aggregate P/E to its own historical range (e.g., is the S&P 500 P/E high or low relative to its 10-year average?).

**Data source:** Alpha Vantage (company overview endpoint provides P/E, P/S, sector, etc.). Yahoo Finance as a fallback/supplement.

---

### Signal 3: Options Market Implied Volatility

**What it represents:** What are the sophisticated risk-pricers anticipating?

**Information source:** The options/derivatives market — a different group of participants making different kinds of bets than equity buyers and sellers.

**Why it's uncorrelated:** Options traders are pricing probability distributions of future outcomes, not expressing simple directional views. IV can spike even when the stock price is flat, signaling that knowledgeable participants expect a big move.

**Components to compute:**
- IV Rank or IV Percentile: Is current implied volatility high or low relative to its own history over the past year? High IV rank means options are expensive, which means the market expects a big move.
- Put/Call ratio: Are more puts or calls being traded? A skewed put/call ratio can indicate directional sentiment among options traders.
- Skew: Is the IV of out-of-the-money puts much higher than OTM calls? If so, the market is pricing in more downside risk than upside potential.

**Composite scoring logic:**
- Bullish: Low-to-moderate IV rank (no panic), put/call ratio declining or low, skew relatively flat.
- Bearish: Elevated IV rank, high put/call ratio, steep negative skew (puts are expensive relative to calls).
- Neutral: Mixed readings.

**Practical note:** This is the hardest signal to get for free. Some options include CBOE data, Barchart.com (limited free data), or Finnhub. This signal may need to be added in a later iteration, or simplified to just put/call ratio from whatever free source is available. The tool should be designed so that it works with four signals and gracefully incorporates the fifth when data is available.

**Not applicable for most ETFs** unless they have liquid options markets (SPY, QQQ, and other major ETFs do).

---

### Signal 4: Macro Regime

**What it represents:** What is the economic environment doing? Is the tide with you or against you?

**Information source:** Macroeconomic data — entirely independent of any individual stock's price or fundamentals.

**Why it's uncorrelated:** A stock can look perfect on every micro-level signal, but if credit conditions are deteriorating and the economy is rolling over, the macro tide will work against the position.

**Components to track:**
- Yield curve: Is the spread between the 10-year and 2-year Treasury yield positive (normal) or negative (inverted)? Inversion has historically preceded recessions. FRED series: T10Y2Y.
- VIX level and trend: Is the VIX below 15 (calm), 15-25 (elevated), or above 25 (fearful)? Is it trending up or down?
- Federal funds rate direction: Is the Fed tightening (raising rates) or easing (cutting rates)? Easing is generally favorable for equities.
- Credit spreads: Is the spread between investment-grade corporate bonds and Treasuries widening (stress) or tightening (calm)? FRED series: BAMLC0A4CBBB (BBB spread).

**Composite scoring logic:**
- Bullish: Normal yield curve, VIX calm and declining, Fed easing or neutral, credit spreads tight.
- Bearish: Inverted yield curve, VIX elevated and rising, Fed tightening, credit spreads widening.
- Neutral: Mixed readings across indicators.

**Applies equally to stocks and ETFs/index funds.** In fact, this signal is arguably *more* important for broad market ETFs than for individual stocks.

**Data source:** FRED (Federal Reserve Economic Data) — no API key required. Free and comprehensive.

---

### Signal 5: Event Proximity and Earnings History

**What it represents:** Am I accidentally gambling on a coin flip?

**Information source:** Corporate calendar and historical earnings data — a different dimension from price, valuation, options, or macro.

**Why it matters:** If a binary event (earnings report, FDA decision, legal ruling) is imminent, the other four signals become much less relevant. You're not trading a pattern; you're making an unknowing bet on an event outcome. This signal primarily functions as a **filter** rather than a directional indicator.

**Components to check:**
- Days until next earnings report. If earnings are within ~7-10 days, flag this prominently.
- Historical earnings surprise: Does this company tend to beat or miss estimates? A consistent pattern of beating estimates adds a slight bullish lean (and vice versa), but this is weak and should not be weighted heavily.
- Other known upcoming events: Ex-dividend dates, stock splits, index rebalancing, major product launches (where detectable from news).

**Scoring logic:**
- No imminent event: Signal is Neutral (does not block or support a trade).
- Imminent event (earnings within ~7 days): Signal is **Caution** — the tool should prominently warn the user that a binary event is approaching, regardless of what the other signals say. The user can choose to proceed, but they should know.
- Favorable history + no imminent event: Slight Bullish lean.
- Unfavorable history + no imminent event: Slight Bearish lean.

**Data sources:** Finnhub (free tier — earnings calendar, company news). Alpha Vantage also has an earnings calendar endpoint.

---

## Architecture and User Experience

### Technology Approach

The tool should be a **self-contained, browser-based web application** — a single-page app the user runs locally. The user does not write code; they interact entirely through a UI.

**Tech stack suggestion:**
- Frontend: HTML/CSS/JavaScript (React or plain vanilla JS, depending on complexity). Should feel like a clean, modern dashboard.
- Data fetching: Client-side API calls to free data providers, or a lightweight local backend (Node.js or Python) that handles API calls and caching.
- No database required initially — watchlist and settings can be stored in localStorage or a simple JSON file.

### User Interface Concepts

**On-Demand Analysis View:**
- Text input for ticker symbol.
- "Analyze" button.
- Dashboard displays all five signals with their individual ratings (Bullish / Neutral / Bearish / Caution) and a brief explanation of why.
- Prominent convergence summary at the top: e.g., "4/5 signals bullish — strong convergence" or "Mixed signals — no clear edge."
- Visual chart of the stock's recent price action.
- Each signal section is expandable for more detail.

**Watchlist / Scanner View:**
- User adds tickers to a watchlist.
- The tool periodically checks all tickers (respecting API rate limits).
- Displays a summary table: Ticker | Trend | Valuation | Options | Macro | Events | Overall.
- Highlights any tickers where strong convergence has been detected.
- Optional: Simple notification/alert when convergence occurs.

### API Rate Limit Management

Free tier APIs have strict limits (e.g., Alpha Vantage free tier: 25 requests/day). The tool must:
- Cache data aggressively — don't re-fetch data that hasn't changed.
- Batch requests intelligently.
- Clearly communicate to the user when rate limits are reached.
- Prioritize on-demand analysis over background scanning when limits are tight.
- Consider using end-of-day data rather than real-time data, which is both more available on free tiers and more appropriate for the tool's medium-term analysis style (this is not a day-trading tool).

### API Keys Required

The user will need to sign up for free accounts and obtain API keys for:
1. **Alpha Vantage** (https://www.alphavantage.co/support/#api-key) — primary source for price data, technicals, fundamentals, earnings calendar.
2. **Finnhub** (https://finnhub.io/) — supplementary source for earnings calendar, company news, basic sentiment. Free tier available.
3. **FRED** (https://fred.stlouisfed.org/) — macro data. No API key required for basic access, though a key is available for heavier usage.
4. **Options data source TBD** — this may be Barchart, CBOE, or another provider. To be determined based on what's freely available at build time. The tool should work without this signal initially.

The tool should have a simple settings/configuration screen where the user pastes in their API keys on first use.

---

## Convergence Scoring Framework

### Individual Signal Scoring

Each signal produces a score from -2 to +2:
- **+2:** Strongly Bullish
- **+1:** Mildly Bullish
- **0:** Neutral
- **-1:** Mildly Bearish
- **-2:** Strongly Bearish

Signal 5 (Events) additionally produces a **Caution** flag that is independent of direction.

### Composite Convergence Logic

**Sum the five signal scores** (range: -10 to +10).

Suggested interpretation thresholds (to be refined through backtesting):
- **+7 to +10:** Strong bullish convergence. Multiple independent sources agree.
- **+4 to +6:** Moderate bullish lean. Promising but not overwhelming.
- **-3 to +3:** No clear edge. Do not act.
- **-6 to -4:** Moderate bearish lean.
- **-10 to -7:** Strong bearish convergence.

**Override rules:**
- If Signal 5 is flagging **Caution** (imminent binary event), the tool should display a prominent warning regardless of the composite score.
- If any single signal is at -2 while the composite is positive (or +2 while composite is negative), flag the disagreement. One strong dissenting signal is worth paying attention to.

---

## Risk Management Integration (Important)

The tool should include basic risk management guardrails, even if simple:

- **Position sizing suggestion:** Based on the user's stated account size and risk tolerance, suggest a maximum position size for any single trade. A common rule of thumb is risking no more than 1-2% of total capital on any single position.
- **Stop loss suggestion:** Based on recent volatility (e.g., ATR — Average True Range), suggest a stop loss level where the trade thesis would be invalidated.
- **Diversification check:** If the watchlist scanner is flagging multiple stocks in the same sector, warn the user that they may be concentrating risk.

These don't need to be sophisticated — even simple guardrails dramatically improve outcomes for experimental investors.

---

## Build Phases

### Phase 1: Core On-Demand Analysis
- Text input for ticker.
- Fetch and display Signal 1 (Price Trend/Momentum) and Signal 2 (Fundamental Valuation).
- Basic convergence score from these two signals.
- Clean, functional UI.
- This phase validates the architecture and data pipeline.

### Phase 2: Add Macro and Events
- Add Signal 4 (Macro Regime) using FRED data.
- Add Signal 5 (Event Proximity) using earnings calendar data.
- Update convergence scoring to incorporate all available signals.
- This phase brings the tool to four of five signals.

### Phase 3: Watchlist and Scanner
- Add ability to save a list of tickers.
- Background checking with rate limit awareness.
- Summary table view with convergence highlighting.

### Phase 4: Options Data and Polish
- Integrate Signal 3 (Options/IV) if a viable free data source is identified.
- Add risk management suggestions.
- Refine UI, add expandable detail sections, improve visual design.
- Add historical tracking: log past signals and outcomes to enable informal backtesting.

---

## Applicable Asset Types

- **Individual stocks:** All five signals apply fully.
- **ETFs (broad market, e.g., SPY, QQQ):** Signal 1 (price trend) and Signal 4 (macro) are most relevant. Signal 2 (valuation) should be adapted to compare the index P/E to its own historical range rather than to peers. Signal 3 (options) applies for ETFs with liquid options markets. Signal 5 (events) is less applicable but could track major macro events (FOMC meetings, jobs reports).
- **Sector ETFs (e.g., XLF, XLE):** A middle ground. Sector-level fundamentals and macro sensitivity vary by sector, so the tool should ideally be aware of which sectors are more rate-sensitive, commodity-sensitive, etc.

---

## Summary

The tool is a disciplined, multi-signal analysis dashboard that helps the user avoid acting on single-source pattern recognition. It prioritizes genuine signal independence, transparent scoring, and — most importantly — knowing when *not* to act. It is designed for learning and small-scale experimentation, with room to grow in sophistication as the user gains experience and confidence in the approach.
