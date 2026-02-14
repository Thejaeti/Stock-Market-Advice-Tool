import { useState } from 'react';

export default function OverlapWarnings({ overlap, ticker }) {
  if (!overlap || overlap.length === 0) return null;

  return (
    <div className="overlap-section">
      <h3 className="section-title">Holding Overlap</h3>
      {overlap.map((item) => (
        <OverlapItem key={item.ticker} item={item} sourceTicker={ticker} />
      ))}
    </div>
  );
}

function OverlapItem({ item, sourceTicker }) {
  const [expanded, setExpanded] = useState(false);

  let severityClass = 'overlap-low';
  if (item.overlapPct > 30) severityClass = 'overlap-high';
  else if (item.overlapPct > 15) severityClass = 'overlap-medium';

  return (
    <div className={`overlap-item ${severityClass}`}>
      <button className="overlap-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="overlap-item-left">
          <span className="overlap-ticker">{item.ticker}</span>
          <span className="overlap-name">{item.name}</span>
        </div>
        <div className="overlap-item-right">
          <span className={`overlap-pct-badge ${severityClass}`}>
            {item.overlapPct}% overlap
          </span>
          <span className="overlap-shared-count">
            {item.sharedCount} shared
          </span>
          <span className={`expand-arrow ${expanded ? 'open' : ''}`}>&#9660;</span>
        </div>
      </button>
      <div className={`overlap-item-body ${expanded ? 'visible' : ''}`}>
        <table className="overlap-table">
          <thead>
            <tr>
              <th>Holding</th>
              <th>Weight in {sourceTicker}</th>
              <th>Weight in {item.ticker}</th>
            </tr>
          </thead>
          <tbody>
            {item.sharedHoldings.map((h) => (
              <tr key={h.ticker}>
                <td className="overlap-holding-ticker">{h.ticker}</td>
                <td>{h.weightInTarget.toFixed(1)}%</td>
                <td>{h.weightInOther.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
