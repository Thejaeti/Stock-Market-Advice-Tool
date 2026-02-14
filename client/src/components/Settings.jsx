import { useState, useEffect } from 'react';

export default function Settings() {
  const [alphaVantage, setAlphaVantage] = useState('');
  const [finnhub, setFinnhub] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setAlphaVantage(data.alphaVantage || '');
        setFinnhub(data.finnhub || '');
        setStatus(data.usingMockData ? 'Using mock data' : 'Using live data');
      })
      .catch(() => setStatus('Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alphaVantage, finnhub }),
      });
      const data = await res.json();
      setStatus(data.usingMockData ? 'Saved — using mock data' : 'Saved — using live data');
    } catch {
      setStatus('Failed to save settings');
    }
  }

  if (loading) return <div className="settings"><p>Loading settings...</p></div>;

  return (
    <div className="settings">
      <h2>API Configuration</h2>
      <p className="settings-description">
        Add your API keys to use live market data. Without keys, the tool operates in demo mode
        with realistic sample data.
      </p>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="av-key">Alpha Vantage API Key</label>
          <input
            id="av-key"
            type="text"
            value={alphaVantage}
            onChange={(e) => setAlphaVantage(e.target.value)}
            placeholder="Enter your Alpha Vantage API key"
          />
          <small>
            Get a free key at{' '}
            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer">
              alphavantage.co
            </a>
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="fh-key">Finnhub API Key (future use)</label>
          <input
            id="fh-key"
            type="text"
            value={finnhub}
            onChange={(e) => setFinnhub(e.target.value)}
            placeholder="Enter your Finnhub API key"
          />
          <small>Used in future phases for additional data sources.</small>
        </div>

        <button type="submit" className="save-btn">Save Settings</button>
      </form>

      {status && <div className="settings-status">{status}</div>}
    </div>
  );
}
