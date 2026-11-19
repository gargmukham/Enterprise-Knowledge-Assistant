
from pathlib import Path

from pypdf import PdfReader
from docx import Document as DocxDocument

#extract document text 
def extract_text(file_path: str | Path) -> str:
    """
    Extract text from PDF, DOCX, or TXT files.
    """

    file_path = Path(file_path)
    extension = file_path.suffix.lower()

    if extension == ".pdf":
        reader = PdfReader(str(file_path))
        text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

    elif extension == ".docx":
        doc = DocxDocument(str(file_path))
        text = "\n".join(
            paragraph.text for paragraph in doc.paragraphs
        )

    elif extension == ".txt":
        text = file_path.read_text(
            encoding="utf-8-sig",
            errors="replace"
        )

    else:
        raise ValueError("Unsupported file format")

    text = text.strip()

    if not text:
        raise ValueError("No readable text found in the document")

    return text

#split into chunks

def split_into_chunks(
    text: str,
    chunk_size: int = 800,
    overlap: int = 120
) -> list[str]:
    """
    Split extracted text into overlapping chunks.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []

    start = 0

    while start < len(text):
        end = min(
            start + chunk_size,
            len(text)
        )
        #prefer ending at a word boundary
        if end < len(text):
            boundary= text.rfind(
                " ",
                start,
                end
            )
            if boundary > start + chunk_size // 2:
                end = boundary
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(
            start + 1,
            end - overlap
        )

    return chunks
