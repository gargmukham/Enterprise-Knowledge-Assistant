
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Project root directory
BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):

    # Application settings
    app_name: str = "Enterprise Knowledge Assistant"

    # Database settings
    database_url: str

    # Embedding API settings
    ai_embedding_api_key: str = ""
    ai_embedding_url: str = ""
    ai_embedding_model: str = "text-embeddings"
    ai_embedding_dimensions: int = 736

    # Chat API settings
    ai_chat_api_key: str = ""
    ai_chat_url: str = ""
    ai_chat_model: str = "gpt-5-mini"

    # Document settings
    upload_dir: str = "uploads"
    max_file_size_mb: int = 15
    chunk_size: int = 800
    chunk_overlap: int = 120

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )


settings = Settings()
