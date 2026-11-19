import { Inbox } from "lucide-react";

/**
 * Clean empty state placeholder for tables, charts, and search views.
 */
function EmptyState({
  icon,
  title = "No items found",
  description = "There is currently no data to display.",
  action,
  compact = false,
}) {
  const IconComponent = icon || Inbox;

  return (
    <div className={`state-box ${compact ? "state-box--compact" : ""}`}>
      <div className="state-box__icon" aria-hidden="true">
        <IconComponent size={compact ? 20 : 24} />
      </div>
      <div className="state-box__content">
        <h3 className="state-box__title">{title}</h3>
        {description && <p className="state-box__text">{description}</p>}
      </div>
      {action && <div className="state-box__action">{action}</div>}
    </div>
  );
}

export default EmptyState;

