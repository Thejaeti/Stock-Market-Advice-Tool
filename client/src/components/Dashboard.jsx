import { useState, useEffect } from 'react';
import TickerInput from './TickerInput.jsx';
import ConvergenceSummary from './ConvergenceSummary.jsx';
import SignalCard from './SignalCard.jsx';
import PriceChart from './PriceChart.jsx';
import ConvergenceChart from './ConvergenceChart.jsx';
import ThesisView from './ThesisView.jsx';
import ThesisBadge from './ThesisBadge.jsx';
import OverlapWarnings from './OverlapWarnings.jsx';

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('analyze');
  const [thesisData, setThesisData] = useState(null);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [history, setHistory] = useState(null);

  // Fetch thesis data once when switching to thesis view
  useEffect(() => {
    if (viewMode === 'thesis' && !thesisData) {
      setThesisLoading(true);
      fetch('/api/thesis')
        .then((res) => res.json())
        .then((data) => setThesisData(data))
        .catch(() => {})
        .finally(() => setThesisLoading(false));
    }
  }, [viewMode, thesisData]);

  async function handleAnalyze(ticker) {
    setViewMode('analyze');
    setLoading(true);
    setError(null);
    setResult(null);
    setHistory(null);
    try {
      const res = await fetch(`/api/analyze/${encodeURIComponent(ticker)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Analysis failed.');
      } else {
        setResult(data);
        // Non-blocking: fetch history for convergence timeline
        fetch(`/api/history/${encodeURIComponent(ticker)}`)
          .then((r) => r.json())
          .then((h) => setHistory(h))
          .catch(() => {});
      }
    } catch {
      setError('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="view-toggle">
        <button
          className={`view-toggle-btn ${viewMode === 'analyze' ? 'active' : ''}`}
          onClick={() => setViewMode('analyze')}
        >
          Analyze Ticker
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'thesis' ? 'active' : ''}`}
          onClick={() => setViewMode('thesis')}
        >
          AI Thesis
        </button>
      </div>

      {viewMode === 'thesis' ? (
        <ThesisView thesisData={thesisData} onAnalyze={handleAnalyze} loading={thesisLoading} />
      ) : (
        <>
          <TickerInput onAnalyze={handleAnalyze} loading={loading} />

          {error && <div className="error-banner">{error}</div>}

          {loading && (
            <div className="loading-container">
              <div className="loading-skeleton">
                <div className="skeleton-block wide" />
                <div className="skeleton-block" />
                <div className="skeleton-block" />
              </div>
              <p className="loading-text">Analyzing signals...</p>
            </div>
          )}

          {result && (
            <>
              {result.usingMockData && (
                <div className="demo-banner">
                  Demo Mode — using sample data. Add your API key in Settings for live data.
                </div>
              )}

              <div className="result-header">
                <h2 className="ticker-name">
                  {result.ticker} — {result.name}
                </h2>
                <span className="sector-badge">{result.sector}</span>
                <ThesisBadge thesis={result.thesis} />
                {result.currentPrice && (
                  <span className="current-price">${result.currentPrice.toFixed(2)}</span>
                )}
              </div>

              <ConvergenceSummary convergence={result.convergence} />

              <ConvergenceChart data={history} ticker={result.ticker} />

              {result.priceHistory.length > 0 && (
                <PriceChart data={result.priceHistory} ticker={result.ticker} />
              )}

              <div className="signals-section">
                <h3 className="section-title">Signal Breakdown</h3>
                {result.signals.map((signal, i) => (
                  <SignalCard key={i} signal={signal} />
                ))}
              </div>

              <OverlapWarnings overlap={result.overlap} ticker={result.ticker} />

              <p className="analyzed-at">
                Analyzed at {new Date(result.analyzedAt).toLocaleString()}
              </p>
            </>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <div className="empty-icon">&#x1F50D;</div>
              <h2>Enter a ticker to get started</h2>
              <p>
                Try stocks (AAPL, MSFT, GOOGL) or thesis ETFs (SMH, SOXX, QQQ, VOO) in demo mode.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
