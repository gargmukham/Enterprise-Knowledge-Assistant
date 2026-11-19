import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Header from "../components/layout/Header";
import DocumentTable from "../components/documents/DocumentTable";
import UploadModal from "../components/documents/UploadModal";
import DocumentDetailsModal from "../components/documents/DocumentDetailsModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useDocuments } from "../hooks/useDocuments";
import { extractErrorMessage } from "../api/axios";

/**
 * Document management page supporting client-side search & category filtering,
 * document upload, metadata inspection/editing, and deletion with confirmation.
 */
function Documents() {
  const {
    documents,
    totalDocuments,
    loading,
    error,
    refreshDocuments,
    uploadNewDocument,
    updateDocument,
    removeDocument,
  } = useDocuments(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [notification, setNotification] = useState(null);

  const categories = useMemo(() => {
    const unique = new Set(
      documents.map((doc) => doc.category?.trim() || "General")
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const docCategory = doc.category?.trim() || "General";
      const matchesCategory =
        selectedCategory === "all" || docCategory === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const titleMatch = (doc.title || "").toLowerCase().includes(query);
      const fileMatch = (doc.file_name || "").toLowerCase().includes(query);
      return titleMatch || fileMatch;
    });
  }, [documents, searchTerm, selectedCategory]);

  const handleUploadComplete = async (payload) => {
    const result = await uploadNewDocument(payload);
    setNotification({
      type: "success",
      text: `Uploaded "${result.title || payload.file.name}" (${result.chunks_created ?? 0} chunks, embedding status: ${result.embedding_status || "unknown"}).`,
    });
    return result;
  };

  const handleSaveMetadata = async (docId, patchPayload) => {
    const result = await updateDocument(docId, patchPayload);
    setNotification({
      type: "success",
      text: result?.message || "Document metadata updated.",
    });
    return result;
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) {
      return;
    }

    setDeleting(true);
    try {
      const result = await removeDocument(docToDelete.id);
      setNotification({
        type: "success",
        text: result?.message || `Deleted "${docToDelete.title}".`,
      });
      if (selectedDocId === docToDelete.id) {
        setSelectedDocId(null);
      }
      setDocToDelete(null);
    } catch (err) {
      setNotification({
        type: "error",
        text:
          err.userMessage ||
          extractErrorMessage(err, "Failed to delete document."),
      });
      setDocToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 || selectedCategory !== "all";

  const headerActions = (
    <>
      <button
        type="button"
        className="btn btn--secondary"
        onClick={refreshDocuments}
        disabled={loading}
      >
        <RefreshCw
          size={15}
          className={loading ? "spin" : ""}
          aria-hidden="true"
        />
        <span>Refresh</span>
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => setIsUploadOpen(true)}
      >
        <Plus size={16} aria-hidden="true" />
        <span>Upload Document</span>
      </button>
    </>
  );

  return (
    <div className="page">
      <Header
        title="Documents"
        breadcrumb="Documents"
        description="Upload, inspect, filter, and manage enterprise knowledge documents."
        actions={headerActions}
      />

      <main className="page-body">
        {notification && (
          <div
            className={`banner ${notification.type === "error" ? "banner--error" : "banner--success"} mb-4`}
            role={notification.type === "error" ? "alert" : "status"}
          >
            <div className="banner__content">
              {notification.type === "success" && (
                <CheckCircle2 size={16} aria-hidden="true" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Dismiss notification"
              onClick={() => setNotification(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        <section className="card" aria-label="Document list and filters">
          <div className="toolbar">
            <div className="toolbar__filters">
              <div className="search-input-wrap">
                <Search size={16} className="search-input-wrap__icon" aria-hidden="true" />
                <label htmlFor="doc-search-input" className="sr-only">
                  Search documents by title or file name
                </label>
                <input
                  id="doc-search-input"
                  type="search"
                  className="input input--with-icon"
                  placeholder="Search by title or file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-input-wrap__clear"
                    aria-label="Clear search query"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="select-wrap">
                <Filter size={15} className="select-wrap__icon" aria-hidden="true" />
                <label htmlFor="doc-category-filter" className="sr-only">
                  Filter by category
                </label>
                <select
                  id="doc-category-filter"
                  className="select select--with-icon"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="toolbar__meta">
              <span className="text-muted">
                Showing <strong>{filteredDocuments.length}</strong> of{" "}
                <strong>{totalDocuments}</strong> documents
              </span>
            </div>
          </div>

          {loading && documents.length === 0 ? (
            <LoadingState message="Loading documents..." />
          ) : error && documents.length === 0 ? (
            <ErrorState
              title="Unable to load documents"
              message={error}
              onRetry={refreshDocuments}
            />
          ) : filteredDocuments.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={Search}
                title="No matching documents"
                description="No documents matched your current search term or category filter."
                action={
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload a PDF, DOCX, or TXT file (up to 15 MB) to begin indexing knowledge."
                action={
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Plus size={15} aria-hidden="true" />
                    <span>Upload First Document</span>
                  </button>
                }
              />
            )
          ) : (
            <DocumentTable
              documents={filteredDocuments}
              onInspect={(doc) => setSelectedDocId(doc.id)}
              onRequestDelete={(doc) => setDocToDelete(doc)}
            />
          )}
        </section>
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadComplete}
      />

      {selectedDocId && (
        <DocumentDetailsModal
          key={selectedDocId}
          docId={selectedDocId}
          initialDocument={
            documents.find((item) => item.id === selectedDocId) || null
          }
          onClose={() => setSelectedDocId(null)}
          onSaveMetadata={handleSaveMetadata}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(docToDelete)}
        title="Delete Document"
        message={
          docToDelete
            ? `Are you sure you want to permanently delete "${docToDelete.title}"? This will remove the document and all associated text chunks.`
            : ""
        }
        confirmLabel="Delete Document"
        isProcessing={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}

export default Documents;
