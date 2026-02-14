export default function ThesisBadge({ thesis }) {
  if (!thesis) return null;

  if (thesis.avoid) {
    return (
      <span className="thesis-badge thesis-badge-avoid" title={thesis.note}>
        AVOID
      </span>
    );
  }

  const tierClass = `thesis-badge-tier-${thesis.tier}`;
  return (
    <span className={`thesis-badge ${tierClass}`}>
      {thesis.label}
    </span>
  );
}
