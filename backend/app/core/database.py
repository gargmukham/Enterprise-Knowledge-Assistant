
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.app.core.config import settings


# Create PostgreSQL database engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=False
)


# Create database session factory
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


# Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass


# Database dependency for FastAPI routes
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
