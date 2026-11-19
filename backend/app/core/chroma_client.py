from pathlib import Path
import chromadb

#Find the project root directory
BASE_DIR = Path(__file__).resolve().parents[3]

#create a parmanent storage location
CHROMA_PATH = BASE_DIR / "chroma_data"

#Initializing ChromaDB persistent client
client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

#create or connect to our vector collection
collection = client.get_or_create_collection(
    name="enterprise_documents_v2",
    metadata={"hnsw:space": "cosine"}
)