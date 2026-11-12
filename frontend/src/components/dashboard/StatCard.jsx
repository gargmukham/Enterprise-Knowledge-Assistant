/**
 * Clean metric card for dashboard overview statistics.
 */
function StatCard({ label, value, helperText, icon: Icon }) {
  return (
    <div className="card stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {Icon && (
          <span className="stat-card__icon" aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      {helperText && <p className="stat-card__helper">{helperText}</p>}
    </div>
  );
}

export default StatCard;

