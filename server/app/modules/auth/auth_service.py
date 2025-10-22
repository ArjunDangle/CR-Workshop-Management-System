# app/modules/auth/auth_service.py

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select # Keep select

from app.core.config import settings
from app.models import User

# --- Password Hashing Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password using bcrypt."""
    return pwd_context.hash(password)

# --- User Lookup ---
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Fetches a user from the database by their email address."""
    statement = select(User).where(User.email == email)
    # --- FIX: Use execute() and scalar_one_or_none() ---
    user = db.execute(statement).scalar_one_or_none()
    # --- END FIX ---
    return user

# --- Authentication Logic ---
def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticates a user.
    Returns the User object or None if authentication fails.
    """
    user = get_user_by_email(db, email=email) # This function now uses the correct method
    if not user:
        return None # User not found
    if not user.is_active:
        print(f"Authentication failed: User {email} is inactive.") # Added logging
        return None # User is inactive
    if not verify_password(password, user.hashed_password):
        print(f"Authentication failed: Incorrect password for user {email}.") # Added logging
        return None # Incorrect password

    print(f"Authentication successful for user {email}.") # Added logging
    return user # Authentication successful

# --- JWT Token Creation ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt