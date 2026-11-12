import { Loader2 } from "lucide-react";

/**
 * Centered loading indicator for pages, tables, and panels.
 */
function LoadingState({ message = "Loading data...", compact = false }) {
  return (
    <div
      className={`state-box ${compact ? "state-box--compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="state-box__spinner spin" size={compact ? 20 : 26} aria-hidden="true" />
      <p className="state-box__text">{message}</p>
    </div>
  );
}

export default LoadingState;

