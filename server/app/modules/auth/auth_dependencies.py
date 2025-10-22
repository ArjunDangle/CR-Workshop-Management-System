# app/modules/auth/auth_dependencies.py

from typing import Optional
from fastapi import Request # Import Request

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import User
from app.modules.auth import auth_schemas, auth_service

# OAuth2PasswordBearer tells FastAPI where to look for the token
# It expects the token to be sent in the Authorization header as "Bearer <token>"
# The `tokenUrl` points to our login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(
    # Add Request dependency to access headers for logging if needed
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- ADD LOGS ---
    print("\n--- get_current_user Dependency ---")
    # Log headers (optional, can be verbose)
    # print(f"Request Headers: {request.headers}")
    print(f"Token received via oauth2_scheme: {token[:10]}..." if token else "No token received")
    # --- END LOGS ---

    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        # --- ADD LOG ---
        print(f"Token successfully decoded. Payload: {payload}")
        # --- END LOG ---

        email: Optional[str] = payload.get("sub")
        if email is None:
            print("Token validation failed: 'sub' (email) claim missing.")
            raise credentials_exception
        token_data = auth_schemas.TokenData(sub=email)

    except JWTError as e:
        print(f"Token validation failed: JWTError - {e}") # Keep this log
        raise credentials_exception
    except ValidationError as e:
        print(f"Token validation failed: Pydantic ValidationError - {e}") # Keep this log
        raise credentials_exception
    except Exception as e: # Catch any other unexpected errors during decode/validate
        print(f"Token validation failed: Unexpected error - {e}")
        raise credentials_exception


    user = auth_service.get_user_by_email(db, email=token_data.sub)

    # --- ADD LOG ---
    if user:
        print(f"User found in DB for email '{token_data.sub}': ID {user.id}")
    else:
        print(f"User NOT found in DB for email '{token_data.sub}'.")
    # --- END LOG ---

    if user is None:
        raise credentials_exception

    print("--- get_current_user successful ---")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that builds on get_current_user to specifically check
    if the user is active.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user