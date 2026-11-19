from datetime import datetime
 
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    UnicodeText,
    UniqueConstraint,
    func
)
 
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)
 
from backend.app.core.database import Base
 
 
class Document(Base):
 
    __tablename__ = "documents"
 
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )
 
    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False
    )
 
    category: Mapped[str] = mapped_column(
        String(120),
        nullable=False
    )
 
    description: Mapped[str] = mapped_column(
        UnicodeText,
        nullable=False
    )
 
    file_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
 
    file_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )
 
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.sysdatetime(),
        nullable=False
    )
 
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan"
    )
 
 
class DocumentChunk(Base):
 
    __tablename__ = "document_chunks"
 
    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "chunk_index",
            name="uq_document_chunk_index"
        ),
    )
 
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )
 
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        nullable=False,
        index=True
    )
 
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
 
    chunk_text: Mapped[str] = mapped_column(
        UnicodeText,
        nullable=False
    )
 
    vector_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )
 
    document: Mapped["Document"] = relationship(
        back_populates="chunks"
    )

