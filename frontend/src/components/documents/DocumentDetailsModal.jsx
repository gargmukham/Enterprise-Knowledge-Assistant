import { useEffect, useState } from "react";
import { Calendar, FileText, Pencil, Save, Tag, X } from "lucide-react";
import { getDocumentById } from "../../api/documentService";
import { extractErrorMessage } from "../../api/axios";
import { formatDateTime } from "../../utils/formatDate";

/**
 * Modal displaying full document metadata (loaded from GET /documents/{doc_id})
 * and allowing optional metadata updates via PATCH /documents/{doc_id}.
 */
function DocumentDetailsModal({
  docId,
  initialDocument = null,
  onClose,
  onSaveMetadata,
}) {
  const [documentData, setDocumentData] = useState(initialDocument);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(initialDocument?.title || "");
  const [category, setCategory] = useState(initialDocument?.category || "General");
  const [description, setDescription] = useState(initialDocument?.description || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!docId) {
      return undefined;
    }

    let cancelled = false;

    getDocumentById(docId)
      .then((fresh) => {
        if (!cancelled) {
          setDocumentData(fresh);
          setTitle(fresh.title || "");
          setCategory(fresh.category || "General");
          setDescription(fresh.description || "");
          setFetchError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(
            err.userMessage ||
              extractErrorMessage(err, "Unable to refresh document details.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [docId]);

  useEffect(() => {
    if (!docId) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docId, saving, onClose]);

  if (!docId) {
    return null;
  }

  const handleStartEdit = () => {
    if (!documentData) {
      return;
    }
    setTitle(documentData.title || "");
    setCategory(documentData.category || "General");
    setDescription(documentData.description || "");
    setSaveError("");
    setIsEditing(true);
  };

  const handleSubmitEdit = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedCategory || !trimmedDescription) {
      setSaveError("Title, category, and description cannot be empty.");
      return;
    }

    const patchPayload = {};
    if (trimmedTitle !== (documentData?.title || "")) {
      patchPayload.title = trimmedTitle;
    }
    if (trimmedCategory !== (documentData?.category || "")) {
      patchPayload.category = trimmedCategory;
    }
    if (trimmedDescription !== (documentData?.description || "")) {
      patchPayload.description = trimmedDescription;
    }

    if (Object.keys(patchPayload).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const updated = await onSaveMetadata(docId, patchPayload);
      if (updated?.document) {
        setDocumentData(updated.document);
      }
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        err.userMessage ||
          extractErrorMessage(err, "Failed to update document metadata.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h2 id="doc-details-title" className="modal__title">
              Document Metadata
            </h2>
            <p className="modal__subtitle">
              Document ID #{docId}
              {loading ? " • Syncing..." : ""}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close document metadata dialog"
            disabled={saving}
            onClick={onClose}
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          {fetchError && (
            <div className="banner banner--error mb-3" role="alert">
              <span>{fetchError}</span>
            </div>
          )}

          {!documentData ? (
            <p className="text-muted">Loading metadata...</p>
          ) : isEditing ? (
            <form id="edit-doc-form" onSubmit={handleSubmitEdit} className="form-stack">
              {saveError && (
                <div className="banner banner--error" role="alert">
                  <span>{saveError}</span>
                </div>
              )}

              <div className="form-field">
                <label htmlFor="edit-doc-title" className="form-label">
                  Title <span className="required-mark">*</span>
                </label>
                <input
                  id="edit-doc-title"
                  type="text"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={250}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-doc-category" className="form-label">
                  Category <span className="required-mark">*</span>
                </label>
                <input
                  id="edit-doc-category"
                  type="text"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-doc-description" className="form-label">
                  Description <span className="required-mark">*</span>
                </label>
                <textarea
                  id="edit-doc-description"
                  className="textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </form>
          ) : (
            <div className="metadata-list">
              <div className="metadata-item">
                <span className="metadata-item__label">Title</span>
                <span className="metadata-item__value metadata-item__value--strong">
                  {documentData.title}
                </span>
              </div>

              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-item__label">
                    <Tag size={13} aria-hidden="true" /> Category
                  </span>
                  <span className="metadata-item__value">
                    <span className="badge badge--neutral">
                      {documentData.category || "General"}
                    </span>
                  </span>
                </div>

                <div className="metadata-item">
                  <span className="metadata-item__label">
                    <Calendar size={13} aria-hidden="true" /> Uploaded At
                  </span>
                  <span className="metadata-item__value">
                    {formatDateTime(documentData.uploaded_at)}
                  </span>
                </div>
              </div>

              <div className="metadata-item">
                <span className="metadata-item__label">
                  <FileText size={13} aria-hidden="true" /> File Name
                </span>
                <span className="metadata-item__value">
                  {documentData.file_name || "No source file attached (metadata-only record)"}
                </span>
              </div>

              <div className="metadata-item">
                <span className="metadata-item__label">Description</span>
                <p className="metadata-item__description">
                  {documentData.description || "No description provided."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={saving}
                onClick={() => {
                  setIsEditing(false);
                  setSaveError("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-doc-form"
                className="btn btn--primary"
                disabled={saving}
              >
                <Save size={15} aria-hidden="true" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </>
          ) : (
            <>
              {onSaveMetadata && documentData && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleStartEdit}
                >
                  <Pencil size={15} aria-hidden="true" />
                  <span>Edit Metadata</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary"
                onClick={onClose}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailsModal;
