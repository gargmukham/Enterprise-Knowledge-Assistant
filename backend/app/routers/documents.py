

from pathlib import Path
 
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
 
from uuid import uuid4
 
from backend.app.core.config import settings, BASE_DIR

from backend.app.core.database import get_db
 
from backend.app.models.document import (

    Document,

    DocumentChunk

)
 
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
 
from backend.app.services.vector_service import (

    store_chunks,

    delete_document_vectors

)
 
 
router = APIRouter(

    prefix="/documents",

    tags=["Documents"]

)
 
 
# ==========================================

# 1. GET ALL DOCUMENTS

# ==========================================
 
@router.get("/")

def get_documents(db: Session = Depends(get_db)):
 
    total = db.scalar(

        select(func.count()).select_from(Document)

    ) or 0
 
    documents = db.scalars(

        select(Document).order_by(Document.id.desc())

    ).all()
 
    return {

        "total_documents": total,

        "documents": documents

    }
 
 
# ==========================================

# 2. UPLOAD DOCUMENT

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
 
    allowed_extensions = {

        ".pdf",

        ".docx",

        ".txt"

    }
 
    original_filename = file.filename or "Untitled"
 
    extension = Path(original_filename).suffix.lower()
 
    if extension not in allowed_extensions:
 
        raise HTTPException(

            status_code=400,

            detail="Only PDF, DOCX and TXT files are supported"

        )
 
    content = await file.read()
 
    await file.close()
 
    if not content:
 
        raise HTTPException(

            status_code=400,

            detail="Uploaded file is empty"

        )
 
    max_bytes = settings.max_file_size_mb * 1024 * 1024
 
    if len(content) > max_bytes:
 
        raise HTTPException(

            status_code=413,

            detail="File exceeds maximum allowed size"

        )
 
    # Save file in uploads folder
 
    upload_dir = BASE_DIR / settings.upload_dir
 
    upload_dir.mkdir(

        parents=True,

        exist_ok=True

    )
 
    filename = f"{uuid4().hex}{extension}"
 
    saved_path = upload_dir / filename
 
    saved_path.write_bytes(content)
 
    document_id = None
 
    try:
 
        # Step 1: Extract text
 
        extracted_text = extract_text(saved_path)
 
        # Step 2: Chunk text
 
        chunks = split_into_chunks(

            extracted_text,

            chunk_size=settings.chunk_size,

            overlap=settings.chunk_overlap

        )
 
        if not chunks:
 
            raise ValueError("No chunks generated")
 
        # Step 3: Generate embeddings
 
        embeddings = []
 
        for chunk in chunks:
 
            embedding = await create_embedding(chunk)
 
            embeddings.append(embedding)
 
        # Step 4: Create SQL Server document record
 
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
 
        document_id = doc.id
 
        # Step 5: Store embeddings in ChromaDB
 
        vector_ids = store_chunks(

            document_id,

            chunks,

            embeddings

        )
 
        # Step 6: Store chunk metadata in SQL Server
 
        for index, chunk in enumerate(chunks):
 
            db.add(

                DocumentChunk(

                    document_id=document_id,

                    chunk_index=index,

                    chunk_text=chunk,

                    vector_id=vector_ids[index]

                )

            )
 
        # Step 7: Commit SQL Server transaction
 
        db.commit()
 
        db.refresh(doc)
 
        return {

            "message": "Document uploaded successfully",

            "document_id": doc.id,

            "title": doc.title,

            "file_name": doc.file_name,

            "chunks_created": len(chunks),

            "embeddings_stored": len(embeddings),

            "vector_database": "ChromaDB",

            "relational_database": "SQL Server"

        }
 
    except Exception as exc:
 
        db.rollback()
 
        # Clean up ChromaDB if SQL commit fails

        if document_id is not None:
 
            try:

                delete_document_vectors(document_id)

            except Exception as cleanup_error:

                print("Vector cleanup failed:", cleanup_error)
 
        saved_path.unlink(missing_ok=True)
 
        raise HTTPException(

            status_code=500,

            detail=f"Document upload failed: {str(exc)}"

        )
 
 
# ==========================================

# 3. GET DOCUMENT BY ID

# ==========================================
 
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
 
 
# ==========================================

# 4. CREATE DOCUMENT

# ==========================================
 
@router.post("/", status_code=201)

def create_document(

    payload: DocumentCreate,

    db: Session = Depends(get_db)

):
 
    doc = Document(**payload.model_dump())
 
    try:
 
        db.add(doc)

        db.commit()

        db.refresh(doc)
 
    except Exception as exc:
 
        db.rollback()
 
        raise HTTPException(

            status_code=500,

            detail=f"Document creation failed: {str(exc)}"

        )
 
    return {

        "message": "Document created successfully",

        "document": doc

    }
 
 
# ==========================================

# 5. REPLACE DOCUMENT

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
 
    try:
 
        db.commit()

        db.refresh(doc)
 
    except Exception as exc:
 
        db.rollback()
 
        raise HTTPException(

            status_code=500,

            detail=f"Document update failed: {str(exc)}"

        )
 
    return {

        "message": "Document replaced successfully",

        "document": doc

    }
 
 
# ==========================================

# 6. PATCH DOCUMENT

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

            detail="No fields provided"

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
 
    except Exception as exc:
 
        db.rollback()
 
        raise HTTPException(

            status_code=500,

            detail=f"Document patch failed: {str(exc)}"

        )
 
    return {

        "message": "Document updated successfully",

        "document": doc

    }
 
 
# ==========================================

# 7. DELETE DOCUMENT

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
 
    document_id = doc.id
 
    file_path = doc.file_path
 
    try:
 
        db.delete(doc)
 
        db.commit()
 
    except Exception as exc:
 
        db.rollback()
 
        raise HTTPException(

            status_code=500,

            detail=f"Document deletion failed: {str(exc)}"

        )
 
    # Remove corresponding ChromaDB vectors
 
    try:
 
        delete_document_vectors(document_id)
 
    except Exception as exc:
 
        print("ChromaDB cleanup warning:", exc)
 
    # Delete physical file
 
    if file_path:
 
        Path(file_path).unlink(missing_ok=True)
 
    return {

        "message": "Document deleted successfully",

        "document_id": document_id

    }

 