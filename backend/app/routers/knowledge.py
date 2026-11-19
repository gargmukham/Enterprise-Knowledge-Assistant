

from fastapi import APIRouter, Depends, HTTPException

from pydantic import BaseModel, Field
 
from sqlalchemy import select

from sqlalchemy.orm import Session
 
from backend.app.core.database import get_db
 
from backend.app.models.document import (

    Document,

    DocumentChunk

)
 
from backend.app.services.ai_service import (

    create_embedding,

    generate_answer

)
 
from backend.app.services.vector_service import search_chunks
 
 
router = APIRouter(

    prefix="/knowledge",

    tags=["Knowledge Search & Q&A"]

)
 
 
# ==========================================

# 1. REQUEST SCHEMAS

# ==========================================
 
class SearchRequest(BaseModel):
 
    query: str = Field(

        min_length=2,

        max_length=2000

    )
 
    top_k: int = Field(

        default=5,

        ge=1,

        le=20

    )
 
 
class AskRequest(BaseModel):
 
    question: str = Field(

        min_length=2,

        max_length=2000

    )
 
    top_k: int = Field(

        default=5,

        ge=1,

        le=10

    )
 
 
# ==========================================

# 2. RETRIEVE RELEVANT CHUNKS

# ==========================================
 
async def retrieve_chunks(

    query: str,

    top_k: int,

    db: Session

):
 
    try:
 
        # Generate embedding for user query
 
        query_embedding = await create_embedding(query)
 
        # Search vectors in ChromaDB
 
        matches = search_chunks(

            query_embedding,

            top_k

        )
 
        if not matches:

            return []
 
        # Extract vector IDs
 
        vector_ids = [

            match["vector_id"]

            for match in matches

        ]
 
        # Retrieve matching chunk metadata from SQL Server
 
        rows = db.scalars(

            select(DocumentChunk).where(

                DocumentChunk.vector_id.in_(vector_ids)

            )

        ).all()
 
        rows_by_vector_id = {

            row.vector_id: row

            for row in rows

        }
 
        # Preserve ChromaDB ranking order
 
        results = []
 
        for match in matches:
 
            row = rows_by_vector_id.get(

                match["vector_id"]

            )
 
            if row is not None:
 
                results.append({

                    "chunk": row,

                    "similarity": match["similarity"],

                    "distance": match["distance"]

                })
 
        return results
 
    except Exception as exc:
 
        raise HTTPException(

            status_code=503,

            detail=f"Semantic search failed: {str(exc)}"

        )
 
 
# ==========================================

# 3. SEMANTIC SEARCH API

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
 
    for match in matches:
 
        row = match["chunk"]
 
        document = db.get(

            Document,

            row.document_id

        )
 
        results.append({

            "document_id": row.document_id,

            "document_title": (

                document.title if document else None

            ),

            "chunk_id": row.id,

            "chunk_index": row.chunk_index,

            "chunk_text": row.chunk_text,

            "similarity": round(

                match["similarity"],

                4

            )

        })
 
    return {

        "query": payload.query,

        "total_results": len(results),

        "results": results

    }
 
 
# ==========================================

# 4. ASK QUESTION API

# ==========================================
 
@router.post("/ask")

async def ask_question(

    payload: AskRequest,

    db: Session = Depends(get_db)

):
 
    # Step 1: Retrieve relevant chunks
 
    matches = await retrieve_chunks(

        payload.question,

        payload.top_k,

        db

    )
 
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
 
    # Step 2: Prepare context for LLM
 
    context_parts = []
 
    for match in matches:
 
        row = match["chunk"]
 
        document = db.get(

            Document,

            row.document_id

        )
 
        context_parts.append(

            f"Document: {document.title if document else 'Unknown'}\n"

            f"Chunk: {row.chunk_index}\n"

            f"Content: {row.chunk_text}"

        )
 
    context = "\n\n".join(context_parts)
 
    # Step 3: Generate AI answer
 
    try:
 
        answer = await generate_answer(

            question=payload.question,

            context=context

        )
 
    except Exception as exc:
 
        raise HTTPException(

            status_code=503,

            detail=f"AI answer generation failed: {str(exc)}"

        )
 
    # Step 4: Prepare source information
 
    sources = []
 
    for match in matches:
 
        row = match["chunk"]
 
        document = db.get(

            Document,

            row.document_id

        )
 
        sources.append({

            "document_id": row.document_id,

            "document_title": (

                document.title if document else None

            ),

            "chunk_id": row.id,

            "chunk_index": row.chunk_index,

            "similarity": round(

                match["similarity"],

                4

            )

        })
 
    return {

        "question": payload.question,

        "answer": answer,

        "total_sources": len(sources),

        "sources": sources

    }

 