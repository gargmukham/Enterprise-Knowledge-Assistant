from backend.app.core.chroma_client import collection
 
 
# ==========================================
# 1. STORE DOCUMENT CHUNKS
# ==========================================
 
def store_chunks(
    document_id: int,
    chunks: list[str],
    embeddings: list[list[float]]
) -> list[str]:
 
    if len(chunks) != len(embeddings):
        raise ValueError(
            "Chunks and embeddings count must match"
        )
 
    if not chunks:
        return []
 
    ids = [
        f"doc_{document_id}_chunk_{i}"
        for i in range(len(chunks))
    ]
 
    metadata = [
        {
            "document_id": str(document_id),
            "chunk_index": i
        }
        for i in range(len(chunks))
    ]
 
    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadata
    )
 
    return ids
 
 
# ==========================================
# 2. SEARCH SIMILAR CHUNKS
# ==========================================
 
def search_chunks(
    query_embedding: list[float],
    top_k: int = 5
):
 
    if not query_embedding:
        return []
 
    total = collection.count()
 
    if total == 0:
        return []
 
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, total),
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )
 
    ids = results["ids"][0]
 
    documents = results["documents"][0]
 
    metadatas = results["metadatas"][0]
 
    distances = results["distances"][0]
 
    matches = []
 
    for i in range(len(ids)):
 
        matches.append({
            "vector_id": ids[i],
            "chunk_text": documents[i],
            "metadata": metadatas[i],
            "distance": distances[i],
            "similarity": 1 - distances[i]
        })
 
    return matches
 
 
# ==========================================
# 3. DELETE DOCUMENT VECTORS
# ==========================================
 
def delete_document_vectors(document_id: int):
 
    collection.delete(
        where={
            "document_id": str(document_id)
        }
    )
 
 
# ==========================================
# 4. GET COLLECTION INFORMATION
# ==========================================
 
def get_collection_info():
 
    return {
        "collection_name": collection.name,
        "total_vectors": collection.count()
    }