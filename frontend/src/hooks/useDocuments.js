import { useCallback, useEffect, useState } from "react";
import {
  deleteDocument,
  getDocuments,
  patchDocument,
  uploadDocument,
} from "../api/documentService";
import { extractErrorMessage } from "../api/axios";

/**
 * Manage document list fetching, upload, metadata update, and deletion.
 */
export function useDocuments(autoFetch = true) {
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState("");

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDocuments();
      setDocuments(data.documents);
      setTotalDocuments(data.total_documents);
      return data;
    } catch (err) {
      const message =
        err.userMessage || extractErrorMessage(err, "Failed to load documents.");
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return undefined;
    }

    let cancelled = false;

    getDocuments()
      .then((data) => {
        if (!cancelled) {
          setDocuments(data.documents);
          setTotalDocuments(data.total_documents);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err.userMessage ||
            extractErrorMessage(err, "Failed to load documents.");
          setError(message);
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
  }, [autoFetch]);

  const uploadNewDocument = useCallback(
    async (payload) => {
      const result = await uploadDocument(payload);
      await refreshDocuments();
      return result;
    },
    [refreshDocuments]
  );

  const updateDocument = useCallback(
    async (docId, payload) => {
      const result = await patchDocument(docId, payload);
      await refreshDocuments();
      return result;
    },
    [refreshDocuments]
  );

  const removeDocument = useCallback(
    async (docId) => {
      const result = await deleteDocument(docId);
      await refreshDocuments();
      return result;
    },
    [refreshDocuments]
  );

  return {
    documents,
    totalDocuments,
    loading,
    error,
    refreshDocuments,
    uploadNewDocument,
    updateDocument,
    removeDocument,
  };
}
