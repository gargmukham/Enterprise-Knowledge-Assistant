
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

from sqlalchemy import select, func, delete
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db

from backend.app.models.document import Document, DocumentChunk

from backend.app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentPatch,
    DocumentOut,
    DocumentList
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


# ==========================================
# GET - Fetch all documents
# ==========================================

@router.get("/", response_model=DocumentList)
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


# ==========================================
# GET - Fetch document by ID
# ==========================================

@router.get("/{doc_id}", response_model=DocumentOut)
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


# ==========================================
# POST - Upload and process document
# ==========================================

@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...),
    title: str | None = None,
    category: str = "General",
    description: str = "",
    db: Session = Depends(get_db)
):

    # 1. Validate file format

    allowed = {".pdf", ".docx", ".txt"}

    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Supported formats: PDF, DOCX, TXT"
        )

    # 2. Read and validate file size

    content = await file.read()

    max_bytes = settings.max_file_size_mb * 1024 * 1024

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit"
        )

    # 3. Save uploaded file

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid4().hex}{suffix}"
    saved_path = upload_dir / safe_name

    try:

        saved_path.write_bytes(content)

        # 4. Extract text

        extracted = extract_text(str(saved_path))

        if not extracted or not extracted.strip():
            raise ValueError(
                "No readable text found in the uploaded document"
            )

        # 5. Split text into chunks

        chunks = split_into_chunks(extracted)

        if not chunks:
            raise ValueError(
                "Document could not be divided into chunks"
            )

    except Exception as exc:

        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail=f"Document processing failed: {str(exc)}"
        )

    # 6. Create document record

    doc = Document(
        title=title or Path(file.filename or "Untitled").stem,
        category=category,
        description=description or "Uploaded document",
        file_name=file.filename,
        file_path=str(saved_path)
    )

    try:

        db.add(doc)
        db.flush()

        # 7. Generate embeddings and save chunks

        for index, chunk_text in enumerate(chunks):

            vector = await create_embedding(chunk_text)

            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    chunk_index=index,
                    chunk_text=chunk_text,
                    embedding=vector
                )
            )

        # 8. Commit database records

        db.commit()
        db.refresh(doc)

    except Exception as exc:

        db.rollback()
        saved_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=502,
            detail=f"Document processing failed: {str(exc)}"
        )

    # 9. Return response

    return {
        "message": "Document uploaded and processed successfully",
        "document_id": doc.id,
        "title": doc.title,
        "file_name": doc.file_name,
        "chunks_created": len(chunks),
        "embedding_status": "created"
    }


# ==========================================
# POST - Create document manually
# ==========================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db)
):

    doc = Document(
        **payload.model_dump()
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "message": "Document created successfully",
        "document": doc
    }


# ==========================================
# PUT - Replace complete document
# ==========================================

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

    db.commit()
    db.refresh(doc)

    return {
        "message": "Document replaced successfully",
        "document": doc
    }


# ==========================================
# PATCH - Partially update document
# ==========================================

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

    db.commit()
    db.refresh(doc)

    return {
        "message": "Document partially updated successfully",
        "document": doc
    }


# ==========================================
# DELETE - Delete document
# ==========================================

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

    deleted_document = {
        "id": doc.id,
        "title": doc.title
    }

    try:

        # Delete associated chunks first

        db.execute(
            delete(DocumentChunk).where(
                DocumentChunk.document_id == doc_id
            )
        )

        db.delete(doc)
        db.commit()

    except Exception:

        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete document"
        )

    return {
        "message": "Document deleted successfully",
        "document": deleted_document
    }
