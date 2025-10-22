# app/modules/auth/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session # Use SQLAlchemy Session type hint

# Database dependency
from app.core.database import get_db

# Authentication services and schemas
from app.modules.auth import auth_service
from app.modules.auth import auth_schemas

# --- Add this import ---
from app.modules.auth.auth_dependencies import get_current_active_user
from app.models import User # Import User model for type hinting dependency

# Create an API router instance specifically for authentication routes
router = APIRouter()

@router.post("/token", response_model=auth_schemas.Token, tags=["Authentication"])
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Handles user login via OAuth2 password flow and returns a JWT access token.
    """
    user = auth_service.authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(
        data={"sub": user.email}
    )

    return {"access_token": access_token, "token_type": "bearer"}


# --- Add the /users/me endpoint ---
@router.get("/users/me", response_model=auth_schemas.UserPublic, tags=["Users"])
async def read_users_me(
    current_user: User = Depends(get_current_active_user) # Use the dependency
):
    """
    Fetches the details of the currently authenticated active user.

    Requires a valid JWT token in the Authorization header (Bearer <token>).
    """
    # The dependency get_current_active_user handles token validation and user fetching.
    # If the token is invalid/expired or the user is inactive, it raises an exception.
    # If valid, the user object is injected into current_user.
    return current_user
# --- End of /users/me endpoint ---