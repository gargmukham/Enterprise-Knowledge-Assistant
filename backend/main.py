
from fastapi import FastAPI

from backend.app.core.config import settings
from backend.app.core.database import Base, engine

# Register SQLAlchemy models
from backend.app import models

# Import API routers
from backend.app.routers import documents, knowledge


# ==========================================
# Initialize Database Tables
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# Initialize FastAPI Application
# ==========================================

app = FastAPI(
    title=settings.app_name,
    description=(
        "Upload enterprise documents, search their content, "
        "and ask document-grounded questions."
    ),
    version="1.0.0"
)


# ==========================================
# Home API
# ==========================================

@app.get("/", tags=["Health"])
def home():
    return {
        "message": "Welcome to Enterprise Knowledge Assistant API",
        "status": "running"
    }


# ==========================================
# Health Check API
# ==========================================

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy"
    }


# ==========================================
# Register API Routers
# ==========================================

app.include_router(documents.router)
app.include_router(knowledge.router)
