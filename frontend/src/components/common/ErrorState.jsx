import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Consistent error banner/card with an optional retry action.
 */
function ErrorState({
  title = "Unable to load data",
  message = "Something went wrong while communicating with the server.",
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`state-box state-box--error ${compact ? "state-box--compact" : ""}`}
      role="alert"
    >
      <div className="state-box__icon state-box__icon--error" aria-hidden="true">
        <AlertCircle size={compact ? 18 : 22} />
      </div>
      <div className="state-box__content">
        <h3 className="state-box__title">{title}</h3>
        <p className="state-box__text">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onRetry}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

export default ErrorState;

