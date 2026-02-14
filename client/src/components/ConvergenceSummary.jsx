export default function ConvergenceSummary({ convergence }) {
  if (!convergence) return null;

  const { compositeScore, label, summary, confidence, dissenting, signalCount } = convergence;
  const maxScore = (signalCount || 5) * 2;

  let colorClass;
  if (dissenting) colorClass = 'mixed';
  else if (compositeScore >= 1) colorClass = 'bullish';
  else if (compositeScore <= -1) colorClass = 'bearish';
  else colorClass = 'neutral';

  return (
    <div className={`convergence-summary ${colorClass}`}>
      <div className="convergence-header">
        <span className="convergence-label">{label}</span>
        <span className="convergence-score">
          Score: {compositeScore > 0 ? '+' : ''}
          {compositeScore} / {maxScore}
        </span>
      </div>
      <p className="convergence-text">{summary}</p>
      <div className="convergence-meta">
        <span className={`confidence-badge confidence-${confidence}`}>
          {confidence} confidence
        </span>
        {dissenting && <span className="dissent-badge">Conflicting signals</span>}
      </div>
    </div>
  );
}
