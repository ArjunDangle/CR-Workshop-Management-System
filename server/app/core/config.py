# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union # Add List and Union

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    """
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # --- Add this field ---
    # It expects a comma-separated string in the .env file
    # Pydantic automatically splits it into a list of strings
    allowed_origins: List[str] = ["http://localhost:8080", "http://127.0.0.1:8080"]
    # --- End ---

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()