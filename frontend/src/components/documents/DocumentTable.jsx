import { Eye, FileText, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/formatDate";

/**
 * Responsive documents table displaying metadata and row actions.
 */
function DocumentTable({ documents, onInspect, onRequestDelete }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Document Title</th>
            <th>Category</th>
            <th>File Name</th>
            <th>Uploaded</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
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
                    onClick={() => onInspect(doc)}
                    aria-label={`View metadata for ${doc.title}`}
                  >
                    <Eye size={14} aria-hidden="true" />
                    <span>Details</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm btn--danger-text"
                    onClick={() => onRequestDelete(doc)}
                    aria-label={`Delete ${doc.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;

