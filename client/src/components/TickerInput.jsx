import { useState } from 'react';

export default function TickerInput({ onAnalyze, loading }) {
  const [ticker, setTicker] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = ticker.trim().toUpperCase();
    if (trimmed) onAnalyze(trimmed);
  }

  return (
    <form className="ticker-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        placeholder="Enter ticker symbol (e.g. AAPL)"
        maxLength={10}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !ticker.trim()}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
}
