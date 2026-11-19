import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { extractErrorMessage } from "../../api/axios";
import { formatFileSize, getFileExtension } from "../../utils/formatFileSize";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const SUGGESTED_CATEGORIES = [
  "General",
  "HR",
  "Engineering",
  "Policy",
  "Finance",
  "Operations",
  "Legal",
];

/**
 * Modal for uploading PDF, DOCX, or TXT files (<= 15 MB) to POST /documents/upload.
 * Sends `file` as multipart form-data and `title`, `category`, `description` as query params.
 */
function UploadModal({ isOpen, onClose, onUpload }) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setCategory("General");
    setDescription("");
    setUploadProgress(0);
    setFormError("");
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !uploading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, uploading, onClose]);

  if (!isOpen) {
    return null;
  }

  const validateAndSelectFile = (file) => {
    setFormError("");
    setUploadResult(null);

    if (!file) {
      return;
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormError("Unsupported file format. Please select a PDF, DOCX, or TXT file.");
      return;
    }

    if (file.size === 0) {
      setFormError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError("File exceeds the maximum allowed size of 15 MB.");
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(baseName);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    validateAndSelectFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (uploading) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    validateAndSelectFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedFile) {
      setFormError("Please select a PDF, DOCX, or TXT file to upload.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await onUpload({
        file: selectedFile,
        title,
        category: category.trim() || "General",
        description,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      setUploadResult(result);
    } catch (err) {
      setFormError(
        err.userMessage || extractErrorMessage(err, "Document upload failed.")
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h2 id="upload-modal-title" className="modal__title">
              Upload Document
            </h2>
            <p className="modal__subtitle">
              Supported formats: PDF, DOCX, TXT (max 15 MB)
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close upload dialog"
            disabled={uploading}
            onClick={handleClose}
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          {uploadResult ? (
            <div className="upload-result">
              <div className="upload-result__header">
                <CheckCircle2 size={22} className="text-success" aria-hidden="true" />
                <div>
                  <h3 className="upload-result__title">
                    {uploadResult.message || "Document uploaded successfully"}
                  </h3>
                  <p className="upload-result__subtitle">
                    {uploadResult.title} ({uploadResult.file_name})
                  </p>
                </div>
              </div>

              <dl className="upload-result__stats">
                <div className="upload-result__stat">
                  <dt>Document ID</dt>
                  <dd>#{uploadResult.document_id}</dd>
                </div>
                <div className="upload-result__stat">
                  <dt>Chunks Created</dt>
                  <dd>{uploadResult.chunks_created ?? "—"}</dd>
                </div>
                <div className="upload-result__stat">
                  <dt>Embedding Status</dt>
                  <dd>
                    <span
                      className={`badge ${
                        uploadResult.embedding_status === "completed"
                          ? "badge--success"
                          : uploadResult.embedding_status === "partial"
                            ? "badge--warning"
                            : "badge--neutral"
                      }`}
                    >
                      {uploadResult.embedding_status || "unknown"}
                    </span>
                  </dd>
                </div>
                <div className="upload-result__stat">
                  <dt>Embedded Chunks</dt>
                  <dd>
                    {uploadResult.embedded_chunks ?? 0}
                    {typeof uploadResult.failed_embeddings === "number" &&
                      uploadResult.failed_embeddings > 0 &&
                      ` (${uploadResult.failed_embeddings} failed)`}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <form id="upload-document-form" onSubmit={handleSubmit} className="form-stack">
              {formError && (
                <div className="banner banner--error" role="alert">
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-field">
                <label htmlFor="upload-file-input" className="form-label">
                  Document File <span className="required-mark">*</span>
                </label>

                <div
                  className={`dropzone ${isDragging ? "dropzone--active" : ""} ${selectedFile ? "dropzone--selected" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!uploading) {
                      setIsDragging(true);
                    }
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="upload-file-input"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="dropzone__file">
                      <FileUp size={20} className="text-primary" aria-hidden="true" />
                      <div className="dropzone__file-info">
                        <span className="dropzone__file-name">{selectedFile.name}</span>
                        <span className="dropzone__file-size">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="upload-file-input" className="dropzone__prompt">
                      <UploadCloud size={26} className="dropzone__icon" aria-hidden="true" />
                      <span className="dropzone__text">
                        <strong>Click to browse</strong> or drag and drop a file here
                      </span>
                      <span className="dropzone__hint">
                        PDF, DOCX, or TXT up to 15 MB
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="upload-doc-title" className="form-label">
                    Title
                  </label>
                  <input
                    id="upload-doc-title"
                    type="text"
                    className="input"
                    placeholder="Defaults to file name if left blank"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                    maxLength={250}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="upload-doc-category" className="form-label">
                    Category
                  </label>
                  <input
                    id="upload-doc-category"
                    type="text"
                    list="upload-category-suggestions"
                    className="input"
                    placeholder="e.g. HR, Engineering, Policy"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={uploading}
                    maxLength={120}
                  />
                  <datalist id="upload-category-suggestions">
                    {SUGGESTED_CATEGORIES.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="upload-doc-description" className="form-label">
                  Description
                </label>
                <textarea
                  id="upload-doc-description"
                  className="textarea"
                  rows={3}
                  placeholder="Optional summary of what this document covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="upload-progress" role="status" aria-live="polite">
                  <div className="upload-progress__row">
                    <span className="upload-progress__label">
                      <Loader2 size={14} className="spin" aria-hidden="true" />
                      {uploadProgress < 100
                        ? "Uploading file..."
                        : "Extracting text and generating embeddings..."}
                    </span>
                    <span className="upload-progress__percent">{uploadProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="modal__footer">
          {uploadResult ? (
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={resetForm}
              >
                Upload Another
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleClose}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={uploading}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="upload-document-form"
                className="btn btn--primary"
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
