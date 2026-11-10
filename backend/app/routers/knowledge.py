
import re
import math

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.document import Document, DocumentChunk
from backend.app.services.ai_service import (
    create_embedding,
    generate_answer
)


router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Search & Q&A"]
)


# ==========================================
# REQUEST SCHEMAS
# ==========================================

class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


# ==========================================
# COSINE SIMILARITY
# ==========================================

def cosine_similarity(
    a: list[float],
    b: list[float]
) -> float:

    if not a or not b or len(a) != len(b):
        return 0.0

    dot_product = sum(x * y for x, y in zip(a, b))

    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(y * y for y in b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


# ==========================================
# KEYWORD SEARCH FALLBACK
# ==========================================

def keyword_search(
    query: str,
    rows: list,
    top_k: int
):

    query_terms = set(
        re.findall(r"\b\w+\b", query.lower())
    )

    stop_words = {
        "the", "is", "are", "was", "were",
        "a", "an", "and", "or", "in", "on",
        "at", "to", "of", "for", "with",
        "what", "which", "who", "how", "does"
    }

    query_terms -= stop_words

    if not query_terms:
        query_terms = set(
            re.findall(r"\b\w+\b", query.lower())
        )

    scored = []

    for row in rows:

        text_terms = set(
            re.findall(r"\b\w+\b", row.chunk_text.lower())
        )

        matching_terms = query_terms.intersection(text_terms)

        if matching_terms:

            score = len(matching_terms) / len(query_terms)

            scored.append((float(score), row))

    scored.sort(
        key=lambda item: item[0],
        reverse=True
    )

    return scored[:top_k]


# ==========================================
# RETRIEVE RELEVANT DOCUMENT CHUNKS
# ==========================================

async def retrieve_chunks(
    query: str,
    top_k: int,
    db: Session
):

    rows = db.scalars(
        select(DocumentChunk)
    ).all()

    if not rows:
        return []

    # Try semantic search first

    query_vector = None

    try:
        query_vector = await create_embedding(query)

    except Exception:
        query_vector = None

    if query_vector:

        scored = []

        for row in rows:

            if row.embedding:

                score = cosine_similarity(
                    query_vector,
                    row.embedding
                )

                scored.append((score, row))

        scored.sort(
            key=lambda item: item[0],
            reverse=True
        )

        if scored:
            return scored[:top_k]

    # Fallback to keyword search

    return keyword_search(
        query,
        rows,
        top_k
    )


# ==========================================
# KNOWLEDGE SEARCH API
# ==========================================

@router.post("/search")
async def search_knowledge(
    payload: SearchRequest,
    db: Session = Depends(get_db)
):

    matches = await retrieve_chunks(
        payload.query,
        payload.top_k,
        db
    )

    results = []

    for score, row in matches:

        document = db.get(Document, row.document_id)

        results.append({
            "document_id": row.document_id,
            "document_title": document.title if document else None,
            "chunk_id": row.id,
            "chunk_index": row.chunk_index,
            "chunk_text": row.chunk_text,
            "score": round(score, 4)
        })

    return {
        "query": payload.query,
        "total_results": len(results),
        "results": results
    }


# ==========================================
# ASK QUESTION API
# ==========================================

@router.post("/ask")
async def ask_question(
    payload: AskRequest,
    db: Session = Depends(get_db)
):

    matches = await retrieve_chunks(
        payload.question,
        payload.top_k,
        db
    )

    # No relevant content found

    if not matches:

        return {
            "question": payload.question,
            "answer": (
                "I could not find relevant information "
                "in the uploaded documents."
            ),
            "total_sources": 0,
            "sources": []
        }

    # Prepare document context

    context = "\n\n".join(
        (
            f"[Document ID: {row.document_id}, "
            f"Chunk ID: {row.id}]\n"
            f"{row.chunk_text}"
        )
        for score, row in matches
    )

    # Generate AI answer

    try:

        answer = await generate_answer(
            payload.question,
            context
        )

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail=f"AI service is unavailable: {str(exc)}"
        )

    # Prepare source information

    sources = []

    for score, row in matches:

        document = db.get(Document, row.document_id)

        sources.append({
            "document_id": row.document_id,
            "document_title": document.title if document else None,
            "chunk_id": row.id,
            "chunk_index": row.chunk_index,
            "score": round(score, 4)
        })

    return {
        "question": payload.question,
        "answer": answer,
        "total_sources": len(sources),
        "sources": sources
    }
