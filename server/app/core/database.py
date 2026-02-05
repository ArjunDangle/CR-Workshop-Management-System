# app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlmodel import SQLModel # Import SQLModel base class
from app.core.config import settings
from contextlib import contextmanager
from typing import Generator

# Create the database engine using the URL from settings
engine = create_engine(settings.database_url, echo=True, connect_args={})

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    """
    Creates all database tables defined using SQLModel metadata.
    Should be called once during application startup if tables don't exist.
    """
    # Import all models here before calling create_all
    # This is important so that SQLModel knows about them!
    from app import models # <-- Import base models
    from app.modules.contractor import models as contractor_models # <-- Import contractor models
    print("Creating database tables...")
    SQLModel.metadata.create_all(engine) # <-- UNCOMMENT THIS LINE
    print("Database tables created (if they didn't exist).")


# Dependency to get a DB session for FastAPI endpoints
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.
    Ensures the session is closed afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Context manager for using sessions outside FastAPI requests (e.g., scripts, tests)
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager to provide a database session outside of FastAPI requests.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()