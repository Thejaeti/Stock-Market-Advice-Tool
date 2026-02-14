const TIER_ORDER = [1, 2, 3, 4, 5, 'avoid'];

const PRIORITY_COLORS = {
  Core: 'priority-core',
  High: 'priority-high',
  'Medium-High': 'priority-medium-high',
  Medium: 'priority-medium',
  Low: 'priority-low',
  Avoid: 'priority-avoid',
};

export default function ThesisView({ thesisData, onAnalyze, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-skeleton">
          <div className="skeleton-block wide" />
          <div className="skeleton-block" />
          <div className="skeleton-block" />
        </div>
        <p className="loading-text">Loading thesis...</p>
      </div>
    );
  }

  if (!thesisData) return null;

  const { summary, tiers } = thesisData;

  return (
    <div className="thesis-view">
      <div className="thesis-header">
        <h2>AI Infrastructure Investment Thesis</h2>
        <p className="thesis-summary">{summary}</p>
      </div>

      {TIER_ORDER.map((tierKey) => {
        const tier = tiers[tierKey];
        if (!tier) return null;
        const isAvoid = tierKey === 'avoid';
        const tierLabel = isAvoid ? 'Avoid' : `Tier ${tierKey}`;

        return (
          <div
            key={tierKey}
            className={`thesis-tier ${isAvoid ? 'thesis-tier-avoid' : `thesis-tier-${tierKey}`}`}
          >
            <div className="thesis-tier-header">
              <span className={`thesis-tier-label ${isAvoid ? 'tier-label-avoid' : `tier-label-${tierKey}`}`}>
                {tierLabel}
              </span>
              <h3 className="thesis-tier-name">{tier.name}</h3>
              <span className={`thesis-priority-badge ${PRIORITY_COLORS[tier.priority] || ''}`}>
                {tier.priority}
              </span>
            </div>
            <p className="thesis-tier-rationale">{tier.rationale}</p>
            <div className="thesis-ticker-row">
              {tier.tickers.map((ticker) => (
                <button
                  key={ticker}
                  className={`thesis-ticker-btn ${isAvoid ? 'thesis-ticker-btn-avoid' : ''}`}
                  onClick={() => onAnalyze(ticker)}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
