from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument
from backend.app.core.config import settings

def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    elif suffix == ".docx":
        doc = DocxDocument(str(path))
        text = "\n".join(p.text for p in doc.paragraphs)
    elif suffix == ".txt":
        text = path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError("Only PDF, DOCX and TXT files are supported.")

    if not text.strip():
        raise ValueError("No readable text was found in this file.")
    return text

def split_into_chunks(text: str) -> list[str]:
    size = settings.chunk_size
    overlap = settings.chunk_overlap
    if size <= 0 or overlap < 0 or overlap >= size:
        raise ValueError("Invalid chunk configuration: overlap must be smaller than chunk size.")

    chunks = []
    start = 0
    while start < len(text):
        piece = text[start:start + size].strip()
        if piece:
            chunks.append(piece)
        start += size - overlap
    return chunks
