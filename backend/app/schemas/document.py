from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class DocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    category: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)

class DocumentUpdate(DocumentCreate):
    pass

class DocumentPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    category: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, min_length=1)

class DocumentOut(BaseModel):
    id: int
    title: str
    category: str
    description: str
    file_name: str | None = None
    uploaded_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class DocumentList(BaseModel):
    total_documents: int
    documents: list[DocumentOut]
