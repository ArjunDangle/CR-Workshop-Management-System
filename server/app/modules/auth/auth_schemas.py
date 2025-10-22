# app/modules/auth/auth_schemas.py

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

# --- UNCOMMENT THIS IMPORT ---
from app.models import RoleRead # Import RoleRead from models
# ---

# --- Token Schemas (Keep as is) ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: Optional[str] = None

# --- User Schema (Public Facing) ---
class UserPublic(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    # role_id: UUID # Can remove this if nesting the full role object

    # This line requires RoleRead to be imported
    role: RoleRead # Include the nested role information

    model_config = {
        "from_attributes": True,
    }