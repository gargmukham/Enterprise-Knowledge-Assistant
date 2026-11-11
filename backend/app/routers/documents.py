from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.document import Document, DocumentChunk
from backend.app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentPatch
)
from backend.app.services.document_service import (
    extract_text,
    split_into_chunks
)
from backend.app.services.ai_service import create_embedding


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


# =====================================================
# 1. GET ALL DOCUMENTS
# =====================================================

@router.get("/")
def get_documents(db: Session = Depends(get_db)):

    total = db.scalar(
        select(func.count()).select_from(Document)
    ) or 0

    rows = db.scalars(
        select(Document).order_by(Document.id.desc())
    ).all()

    return {
        "total_documents": total,
        "documents": rows
    }


# =====================================================
# 2. UPLOAD AND PROCESS DOCUMENT
# =====================================================

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str | None = None,
    category: str = "General",
    description: str = "",
    db: Session = Depends(get_db)
):

    allowed_extensions = {".pdf", ".docx", ".txt"}

    original_filename = file.filename or "Untitled"

    suffix = Path(original_filename).suffix.lower()

    # Validate file extension
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Supported formats: PDF, DOCX, TXT"
        )

    # Read uploaded file
    content = await file.read()
    await file.close()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    # Validate file size
    max_bytes = settings.max_file_size_mb * 1024 * 1024

    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit"
        )

    # Create upload directory
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique filename
    safe_name = f"{uuid4().hex}{suffix}"

    saved_path = upload_dir / safe_name

    # Save file
    saved_path.write_bytes(content)

    # -------------------------------------------------
    # Extract text and create chunks
    # -------------------------------------------------

    try:

        extracted_text = extract_text(str(saved_path))

        if not extracted_text or not extracted_text.strip():
            raise ValueError(
                "No readable text found in the uploaded document"
            )

        chunks = split_into_chunks(
    extracted_text,
    chunk_size=settings.chunk_size,
    overlap=settings.chunk_overlap
)

        if not chunks:
            raise ValueError(
                "No text chunks could be generated"
            )

    except Exception as exc:

        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail=f"Document processing failed: {str(exc)}"
        )

    # -------------------------------------------------
    # Save document and generate embeddings
    # -------------------------------------------------

    embedding_success_count = 0
    embedding_failure_count = 0

    try:

        doc = Document(
            title=(
                title.strip()
                if title and title.strip()
                else Path(original_filename).stem
            ),
            category=category,
            description=description or "Uploaded document",
            file_name=original_filename,
            file_path=str(saved_path)
        )

        db.add(doc)
        db.flush()

        # Generate embedding for every chunk
        for index, chunk_text in enumerate(chunks):

            vector = None

            try:

                vector = await create_embedding(chunk_text)

                embedding_success_count += 1

            except Exception as exc:

                embedding_failure_count += 1

                print(
                    f"Embedding failed for chunk {index}: {exc}"
                )

            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    chunk_index=index,
                    chunk_text=chunk_text,
                    embedding=vector
                )
            )

        # Commit document and chunks
        db.commit()

        db.refresh(doc)

    except Exception as exc:

        db.rollback()

        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Database processing failed: {str(exc)}"
        )

    # -------------------------------------------------
    # Determine embedding status
    # -------------------------------------------------

    if embedding_success_count == len(chunks):

        embedding_status = "completed"

    elif embedding_success_count > 0:

        embedding_status = "partial"

    else:

        embedding_status = "unavailable"

    return {
        "message": "Document uploaded and processed successfully",
        "document_id": doc.id,
        "title": doc.title,
        "file_name": doc.file_name,
        "chunks_created": len(chunks),
        "embedding_status": embedding_status,
        "embedded_chunks": embedding_success_count,
        "failed_embeddings": embedding_failure_count
    }


# =====================================================
# 3. GET DOCUMENT BY ID
# =====================================================

@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db)
):

    doc = db.get(Document, doc_id)

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return doc


# =====================================================
# 4. CREATE DOCUMENT
# =====================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db)
):

    doc = Document(**payload.model_dump())

    try:

        db.add(doc)
        db.commit()
        db.refresh(doc)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create document"
        )

    return {
        "message": "Document created successfully",
        "document": doc
    }


# =====================================================
# 5. REPLACE DOCUMENT - PUT
# =====================================================

@router.put("/{doc_id}")
def replace_document(
    doc_id: int,
    payload: DocumentUpdate,
    db: Session = Depends(get_db)
):

    doc = db.get(Document, doc_id)

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    for key, value in payload.model_dump().items():
        setattr(doc, key, value)

    try:

        db.commit()
        db.refresh(doc)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to replace document"
        )

    return {
        "message": "Document replaced successfully",
        "document": doc
    }


# =====================================================
# 6. PARTIALLY UPDATE DOCUMENT - PATCH
# =====================================================

@router.patch("/{doc_id}")
def patch_document(
    doc_id: int,
    payload: DocumentPatch,
    db: Session = Depends(get_db)
):

    doc = db.get(Document, doc_id)

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    if any(value is None for value in changes.values()):
        raise HTTPException(
            status_code=400,
            detail="Null values are not allowed"
        )

    for key, value in changes.items():
        setattr(doc, key, value)

    try:

        db.commit()
        db.refresh(doc)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update document"
        )

    return {
        "message": "Document partially updated successfully",
        "document": doc
    }


# =====================================================
# 7. DELETE DOCUMENT
# =====================================================

@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db)
):

    doc = db.get(Document, doc_id)

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    deleted = {
        "id": doc.id,
        "title": doc.title
    }

    file_path = doc.file_path

    try:

        db.delete(doc)
        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )

    # Delete physical file after successful DB deletion
    if file_path:

        try:

            Path(file_path).unlink(missing_ok=True)

        except OSError as exc:

            print(f"File cleanup warning: {exc}")

    return {
        "message": "Document deleted successfully",
        "document": deleted
    }
