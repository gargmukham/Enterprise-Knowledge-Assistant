
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Initialize FastAPI application
app = FastAPI(
    title="Enterprise Knowledge Assistant",
    description="REST API for managing enterprise documents",
    version="1.0.0"
)


# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to Enterprise Knowledge Assistant API",
        "status": "Running successfully"
    }


# Pydantic Model Implementation

class Document(BaseModel):
    title: str = Field(min_length=1)
    category: str = Field(min_length=1)
    description: str = Field(min_length=1)


# Pydantic Model for partial document updates
class DocumentPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)


# Temporary in-memory document storage
documents = {}
next_id = 1


# ==========================================
# GET METHOD - Fetch all documents
# ==========================================

@app.get("/documents")
def get_all_documents():

    return {
        "total_documents": len(documents),
        "documents": list(documents.values())
    }


# ==========================================
# GET METHOD - Fetch document by ID
# ==========================================

@app.get("/documents/{doc_id}")
def get_document(doc_id: int):

    if doc_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return documents[doc_id]


# ==========================================
# POST METHOD - Create a new document
# ==========================================

@app.post("/documents", status_code=201)
def create_document(document: Document):

    global next_id

    new_document = {
        "id": next_id,
        **document.model_dump()
    }

    documents[next_id] = new_document
    next_id += 1

    return {
        "message": "Document created successfully",
        "document": new_document
    }


# ==========================================
# PUT METHOD - Replace complete document
# ==========================================

@app.put("/documents/{doc_id}")
def update_document(doc_id: int, document: Document):

    if doc_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    updated_document = {
        "id": doc_id,
        **document.model_dump()
    }

    documents[doc_id] = updated_document

    return {
        "message": "Document updated successfully",
        "document": updated_document
    }


# ==========================================
# PATCH METHOD - Partially update document
# ==========================================

@app.patch("/documents/{doc_id}")
def patch_document(doc_id: int, document: DocumentPatch):

    if doc_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    update_data = document.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    # Reject explicit null values
    if any(value is None for value in update_data.values()):
        raise HTTPException(
            status_code=400,
            detail="Null values are not allowed"
        )

    # Update only the provided fields
    documents[doc_id].update(update_data)

    return {
        "message": "Document updated successfully",
        "document": documents[doc_id]
    }


# ==========================================
# DELETE METHOD - Delete a document
# ==========================================

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int):

    if doc_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    deleted_document = documents.pop(doc_id)

    return {
        "message": "Document deleted successfully",
        "document": deleted_document
    }
