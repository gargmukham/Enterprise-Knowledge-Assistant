import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  Layers,
  RefreshCw,
} from "lucide-react";
import Header from "../components/layout/Header";
import StatCard from "../components/dashboard/StatCard";
import DocumentCharts from "../components/dashboard/DocumentCharts";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import DocumentDetailsModal from "../components/documents/DocumentDetailsModal";
import { useDocuments } from "../hooks/useDocuments";
import { formatDate, isWithinLastDays } from "../utils/formatDate";

/**
 * Overview dashboard showing real metrics, category & upload charts,
 * and the most recent documents returned by the backend API.
 */
function Dashboard() {
  const { documents, totalDocuments, loading, error, refreshDocuments, updateDocument } =
    useDocuments(true);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const stats = useMemo(() => {
    const categories = new Set(
      documents.map((doc) => doc.category?.trim() || "General")
    );

    const recentCount = documents.filter((doc) =>
      isWithinLastDays(doc.uploaded_at, 7)
    ).length;

    const filesAttachedCount = documents.filter((doc) =>
      Boolean(doc.file_name)
    ).length;

    const sortedByDate = [...documents].sort((a, b) => {
      const timeA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const timeB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return timeB - timeA || (b.id || 0) - (a.id || 0);
    });

    const latestDoc = sortedByDate[0] || null;

    return {
      totalCount: totalDocuments,
      categoryCount: categories.size,
      recentUploads: recentCount,
      filesAttachedCount,
      latestUploadDate: latestDoc?.uploaded_at
        ? formatDate(latestDoc.uploaded_at)
        : "No uploads",
      latestDocTitle: latestDoc?.title || "",
      recentDocuments: sortedByDate.slice(0, 6),
    };
  }, [documents, totalDocuments]);

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
      <Link to="/documents" className="btn btn--primary">
        <span>Manage Documents</span>
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </>
  );

  return (
    <div className="page">
      <Header
        title="Dashboard"
        breadcrumb="Dashboard"
        description="Overview of your enterprise knowledge repository based on live document records."
        actions={headerActions}
      />

      <main className="page-body">
        {loading && documents.length === 0 ? (
          <div className="card">
            <LoadingState message="Loading repository overview..." />
          </div>
        ) : error && documents.length === 0 ? (
          <div className="card">
            <ErrorState
              title="Could not load dashboard data"
              message={error}
              onRetry={refreshDocuments}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <ErrorState
                  compact
                  title="Refresh failed"
                  message={error}
                  onRetry={refreshDocuments}
                />
              </div>
            )}

            <section
              className="stats-grid"
              aria-label="Document repository statistics"
            >
              <StatCard
                label="Total Documents"
                value={stats.totalCount}
                helperText="Total records stored in the knowledge base"
                icon={FileText}
              />
              <StatCard
                label="Categories"
                value={stats.categoryCount}
                helperText="Unique document categories in use"
                icon={Layers}
              />
              <StatCard
                label="Recent Uploads"
                value={stats.recentUploads}
                helperText="Documents added in the last 7 days"
                icon={Clock}
              />
              <StatCard
                label="Latest Upload"
                value={stats.latestUploadDate}
                helperText={
                  stats.latestDocTitle
                    ? `${stats.filesAttachedCount} with source files • Latest: ${stats.latestDocTitle}`
                    : "No document metadata available yet"
                }
                icon={FolderOpen}
              />
            </section>

            <DocumentCharts documents={documents} />

            <section className="card" aria-label="Recent documents">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Recent Documents</h2>
                  <p className="card__subtitle">
                    Latest uploaded documents from the repository
                  </p>
                </div>
                <Link to="/documents" className="btn btn--ghost btn--sm">
                  <span>View all</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>

              {stats.recentDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents uploaded yet"
                  description="Upload PDF, DOCX, or TXT files on the Documents page to populate your knowledge base."
                  action={
                    <Link to="/documents" className="btn btn--primary btn--sm">
                      Go to Documents
                    </Link>
                  }
                />
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>File Name</th>
                        <th>Upload Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <div className="table-primary-text">{doc.title}</div>
                            {doc.description && (
                              <div className="table-secondary-text truncate-1">
                                {doc.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge badge--neutral">
                              {doc.category || "General"}
                            </span>
                          </td>
                          <td>
                            <span className="file-chip">
                              <FileText size={14} aria-hidden="true" />
                              <span>{doc.file_name || "Metadata only"}</span>
                            </span>
                          </td>
                          <td className="text-muted nowrap">
                            {formatDate(doc.uploaded_at)}
                          </td>
                          <td className="text-right">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => setSelectedDocId(doc.id)}
                                aria-label={`Inspect metadata for ${doc.title}`}
                              >
                                <Eye size={14} aria-hidden="true" />
                                <span>Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedDocId && (
        <DocumentDetailsModal
          key={selectedDocId}
          docId={selectedDocId}
          initialDocument={
            documents.find((item) => item.id === selectedDocId) || null
          }
          onClose={() => setSelectedDocId(null)}
          onSaveMetadata={updateDocument}
        />
      )}
    </div>
  );
}

export default Dashboard;
