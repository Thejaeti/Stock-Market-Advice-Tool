import { useState } from 'react';

export default function SignalCard({ signal }) {
  const [expanded, setExpanded] = useState(false);

  let badgeClass;
  if (signal.score >= 1) badgeClass = 'badge-bullish';
  else if (signal.score <= -1) badgeClass = 'badge-bearish';
  else if (signal.score > 0) badgeClass = 'badge-mild-bullish';
  else if (signal.score < 0) badgeClass = 'badge-mild-bearish';
  else badgeClass = 'badge-neutral';

  const source = signal.dataSource;
  let sourceLabel = null;
  let sourceClass = '';
  if (source === 'live') {
    sourceLabel = 'LIVE';
    sourceClass = 'source-badge-live';
  } else if (source === 'partial') {
    sourceLabel = 'PARTIAL';
    sourceClass = 'source-badge-partial';
  } else if (source === 'config') {
    sourceLabel = 'CONFIG';
    sourceClass = 'source-badge-config';
  } else if (source === 'mock') {
    sourceLabel = 'MOCK';
    sourceClass = 'source-badge-mock';
  }

  return (
    <div className={`signal-card ${expanded ? 'expanded' : ''}`}>
      <button className="signal-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="signal-card-left">
          <span className="signal-name">{signal.signal}</span>
          <span className={`signal-badge ${badgeClass}`}>{signal.label}</span>
          {sourceLabel && (
            <span className={`source-badge ${sourceClass}`}>{sourceLabel}</span>
          )}
        </div>
        <div className="signal-card-right">
          <span className="signal-score">
            {signal.score > 0 ? '+' : ''}
            {signal.score}
          </span>
          <span className={`expand-arrow ${expanded ? 'open' : ''}`}>&#9660;</span>
        </div>
      </button>
      <div className={`signal-card-body ${expanded ? 'visible' : ''}`}>
        <p className="signal-explanation">{signal.explanation}</p>
        {signal.components && (
          <div className="signal-components">
            <h4>Component Details</h4>
            <table className="components-table">
              <tbody>
                {Object.entries(signal.components).map(([key, value]) => {
                  if (value === null || value === undefined || typeof value === 'object') return null;
                  return (
                    <tr key={key}>
                      <td className="comp-key">{formatKey(key)}</td>
                      <td className="comp-value">{formatValue(key, value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace('Sma', 'SMA')
    .replace('Rsi', 'RSI')
    .replace('Macd', 'MACD')
    .replace('Pe ', 'P/E ')
    .replace('Ps ', 'P/S ')
    .replace('Pfcf', 'P/FCF');
}

function formatValue(key, value) {
  if (typeof value === 'number') {
    if (key.includes('Score')) return value > 0 ? `+${value}` : `${value}`;
    if (key.includes('rice') || key.includes('sma')) return `$${value.toFixed(2)}`;
    if (key.includes('Growth')) return `${(value * 100).toFixed(1)}%`;
    return value.toFixed(2);
  }
  return String(value);
}
