# app/models.py
from typing import List, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


# --- Role Model ---
# Represents a user role within the system, supporting hierarchy.
class RoleBase(SQLModel):
    name: str = Field(index=True, unique=True, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    # Self-referencing Foreign Key for hierarchy
    parent_id: Optional[UUID] = Field(default=None, foreign_key="role.id", index=True)


class Role(RoleBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

    # Relationship to parent role (one-to-many with self)
    parent: Optional["Role"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Role.id"} # Specify remote side for self-referencing
    )
    children: List["Role"] = Relationship(back_populates="parent")

    # Relationship to users (one role to many users)
    users: List["User"] = Relationship(back_populates="role")


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    id: UUID


class RoleReadWithChildren(RoleRead):
     children: List["RoleRead"] = [] # Show children roles


class RoleUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


# --- User Model ---
# Represents a system user.
class UserBase(SQLModel):
    email: str = Field(index=True, unique=True, max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)
    # Foreign Key to the Role table
    role_id: UUID = Field(foreign_key="role.id", index=True)


class User(UserBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str = Field(index=True) # Ensure password hash is indexed for lookups

    # Relationship to role (many users to one role)
    role: Role = Relationship(back_populates="users")


class UserCreate(UserBase):
    password: str # Plain password, will be hashed before saving


class UserRead(UserBase):
    id: UUID
    role: RoleRead # Include role information when reading a user


class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[UUID] = None
    password: Optional[str] = None # Allow password update