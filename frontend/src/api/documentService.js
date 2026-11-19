import apiClient from "./axios";

/**
 * Fetch all documents from GET /documents/
 * Returns { total_documents, documents }.
 */
export async function getDocuments() {
  const response = await apiClient.get("/documents/");
  const data = response.data || {};
  return {
    total_documents:
      typeof data.total_documents === "number"
        ? data.total_documents
        : Array.isArray(data.documents)
          ? data.documents.length
          : 0,
    documents: Array.isArray(data.documents) ? data.documents : [],
  };
}

/**
 * Fetch a single document by ID from GET /documents/{doc_id}
 */
export async function getDocumentById(docId) {
  const response = await apiClient.get(`/documents/${docId}`);
  return response.data;
}

/**
 * Upload a document file via POST /documents/upload.
 * Note: `file` is sent as multipart form data, while `title`, `category`,
 * and `description` are sent as query parameters to match the FastAPI contract.
 */
export async function uploadDocument({
  file,
  title,
  category,
  description,
  onUploadProgress,
}) {
  const formData = new FormData();
  formData.append("file", file);

  const params = {};
  if (title && title.trim()) {
    params.title = title.trim();
  }
  if (category && category.trim()) {
    params.category = category.trim();
  }
  if (description && description.trim()) {
    params.description = description.trim();
  }

  const response = await apiClient.post("/documents/upload", formData, {
    params,
    timeout: 60000,
    onUploadProgress,
  });

  return response.data;
}

/**
 * Create a metadata-only document record via POST /documents/
 */
export async function createDocument(payload) {
  const response = await apiClient.post("/documents/", payload);
  return response.data;
}

/**
 * Replace an existing document's metadata via PUT /documents/{doc_id}
 */
export async function replaceDocument(docId, payload) {
  const response = await apiClient.put(`/documents/${docId}`, payload);
  return response.data;
}

/**
 * Partially update an existing document's metadata via PATCH /documents/{doc_id}
 */
export async function patchDocument(docId, payload) {
  const response = await apiClient.patch(`/documents/${docId}`, payload);
  return response.data;
}

/**
 * Delete a document via DELETE /documents/{doc_id}
 */
export async function deleteDocument(docId) {
  const response = await apiClient.delete(`/documents/${docId}`);
  return response.data;
}

