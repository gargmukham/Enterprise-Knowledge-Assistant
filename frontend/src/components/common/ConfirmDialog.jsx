import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Reusable confirmation modal for destructive actions such as document deletion.
 */
function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isProcessing) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isProcessing) {
          onCancel();
        }
      }}
    >
      <div
        className="modal modal--sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div className="confirm-dialog__title-row">
            <span
              className={`confirm-dialog__badge ${variant === "danger" ? "confirm-dialog__badge--danger" : ""}`}
              aria-hidden="true"
            >
              <AlertTriangle size={18} />
            </span>
            <h2 id="confirm-dialog-title" className="modal__title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close confirmation dialog"
            disabled={isProcessing}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          <p id="confirm-dialog-message" className="confirm-dialog__message">
            {message}
          </p>
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={isProcessing}
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${variant === "danger" ? "btn--danger" : "btn--primary"}`}
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {isProcessing ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
