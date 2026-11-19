import os
 
from dotenv import load_dotenv
from urllib.parse import quote_plus
 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
 
 
# Load environment variables from .env
load_dotenv()
 
 
# Read SQL Server configuration
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_DRIVER = os.getenv(
    "DB_DRIVER",
    "ODBC Driver 18 for SQL Server"
)
 
 
# Validate configuration
if not DB_SERVER or not DB_NAME:
    raise ValueError("Database configuration missing in .env")
 
 
# Build ODBC connection string
odbc_connection = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)
 
 
# Safely encode connection string
connection_url = (
    "mssql+pyodbc:///?odbc_connect="
    + quote_plus(odbc_connection)
)
 
 
# Create SQLAlchemy engine
engine = create_engine(
    connection_url,
    pool_pre_ping=True
)
 
 
# Create database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
 
 
# Common Base for SQLAlchemy models
Base = declarative_base()
 
 
# Database dependency for FastAPI
def get_db():
 
    db = SessionLocal()
 
    try:
        yield db
 
    finally:
        db.close()

