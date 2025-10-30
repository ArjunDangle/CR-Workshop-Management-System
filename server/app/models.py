# app/models.py
from typing import List, Optional
from uuid import UUID, uuid4
# --- FIX: Import 'datetime' module directly to avoid name collision ---
import datetime
# --- END FIX ---

from sqlmodel import Field, Relationship, SQLModel 
from sqlalchemy import Column, Date, Time


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
        sa_relationship_kwargs={"remote_side": "Role.id"}
    )
    children: List["Role"] = Relationship(back_populates="parent")

    # Relationship to users (one role to many users)
    users: List["User"] = Relationship(back_populates="role")


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    id: UUID


class RoleReadWithChildren(RoleRead):
     children: List["RoleRead"] = []


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
    hashed_password: str = Field(index=True) 

    # Relationship to role (many users to one role)
    role: Role = Relationship(back_populates="users")

    # --- MODIFICATION: Add relationships for Permits ---
    initiated_permits: List["Permit"] = Relationship(
        back_populates="permittee",
        sa_relationship_kwargs={
            "foreign_keys": "[Permit.permittee_id]",
        }
    )
    authorized_permits: List["Permit"] = Relationship(
        back_populates="authorizer",
        sa_relationship_kwargs={
            "foreign_keys": "[Permit.authorizer_id]",
        }
    )
    approved_permits: List["Permit"] = Relationship(
        back_populates="approver",
        sa_relationship_kwargs={
            "foreign_keys": "[Permit.approver_id]",
        }
    )
    # --- END MODIFICATION ---


class UserCreate(UserBase):
    password: str 


class UserRead(UserBase):
    id: UUID
    role: RoleRead


class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[UUID] = None
    password: Optional[str] = None


# --- NEW: PermitPPE Model ---
# Stores the list of PPE items associated with a permit
class PermitPPE(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    permit_id: UUID = Field(foreign_key="permit.id", index=True)
    
    name: str
    # --- FIX: Use datetime.date ---
    issued_on: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    # --- END FIX ---
    checked: Optional[bool] = Field(default=False)
    
    permit: "Permit" = Relationship(back_populates="ppes")


# --- NEW: PermitAttendee Model ---
# Stores the list of attendees associated with a permit
class PermitAttendee(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    permit_id: UUID = Field(foreign_key="permit.id", index=True)
    
    name: str
    phone: str
    
    permit: "Permit" = Relationship(back_populates="attendees")


# --- NEW: Permit Model ---
# Represents a work permit and its lifecycle, with all fields from the forms.
class PermitBase(SQLModel):
    # --- Core Workflow Fields ---
    permit_type: str = Field(index=True, max_length=50) # "Height" or "Electrical"
    status: str = Field(default="Pending Authorization", index=True, max_length=50)
    
    # --- Top Section Fields ---
    permit_no: Optional[str] = Field(default=None, max_length=100, index=True)
    # --- FIX: Use datetime.date ---
    date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    # --- END FIX ---
    person_responsible: Optional[str] = Field(default=None, max_length=255)
    work_location: Optional[str] = Field(default=None, max_length=255)
    work_description: Optional[str] = Field(default=None, max_length=500)
    
    # --- Schedule Section ---
    # --- FIX: Use datetime.date ---
    start_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    # --- FIX: Use datetime.time ---
    start_time: Optional[datetime.time] = Field(default=None, sa_column=Column(Time))
    # --- FIX: Use datetime.date ---
    finish_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    # --- FIX: Use datetime.time ---
    finish_time: Optional[datetime.time] = Field(default=None, sa_column=Column(Time))

    # --- Fall Protection Section ---
    fall_system_description: Optional[str] = Field(default=None)
    fall_does_not_arrest: Optional[str] = Field(default=None) # "yes" or "no"
    certified_crane_near_ladder: Optional[bool] = Field(default=False)

    # --- Work Context Section ---
    on_crane_describe: Optional[str] = Field(default=None)
    other_describe: Optional[str] = Field(default=None)
    hazard_assessed: Optional[bool] = Field(default=False)
    work_can_proceed: Optional[bool] = Field(default=False)

    # --- Method of Access Section (Flattened) ---
    method_access_fixed_ladder: Optional[bool] = Field(default=False)
    method_access_elevated_platform: Optional[bool] = Field(default=False)
    method_access_scissor_lift: Optional[bool] = Field(default=False)
    method_access_boom_lifter: Optional[bool] = Field(default=False)
    method_access_catwalk: Optional[bool] = Field(default=False)
    fixed_ladder_other_person_at_foot: Optional[str] = Field(default=None) # Hazard control
    fixed_ladder_adjustable_lanyard: Optional[str] = Field(default=None) # Key control

    # --- Isolation Section ---
    electrical_isolation_obtained: Optional[str] = Field(default=None) # "yes" or "no"
    isolation_from: Optional[str] = Field(default=None) # Storing as string to capture date/time text
    isolation_to: Optional[str] = Field(default=None)
    other_block_required: Optional[bool] = Field(default=False)
    other_block_describe: Optional[str] = Field(default=None)

    # --- Authorisation Section (from form) ---
    authorizer_name: Optional[str] = Field(default=None)
    # --- FIX: Use datetime.date ---
    authorizer_signature_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    
    # --- Timestamps & System Signatures ---
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    # 1. Permittee (Initiator) - System Link
    permittee_id: UUID = Field(foreign_key="user.id", index=True)
    
    # 2. Authorizer (SSE-Office) - System Link
    authorizer_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    authorized_at: Optional[datetime.datetime] = Field(default=None)
    
    # 3. Approver (Safety Officer) - System Link
    approver_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    approved_at: Optional[datetime.datetime] = Field(default=None)
    approver_remarks: Optional[str] = Field(default=None, max_length=500)
    
    # --- NEW FIELDS (Phases 3 & 4) ---
    actual_start_time: Optional[datetime.datetime] = Field(default=None)
    actual_end_time: Optional[datetime.datetime] = Field(default=None)
    extension_requested: Optional[bool] = Field(default=False, index=True)
    extension_reason: Optional[str] = Field(default=None, max_length=500)
    requested_new_end_time: Optional[datetime.datetime] = Field(default=None)
    # --- END NEW FIELDS ---


class Permit(PermitBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

    # --- Relationships ---
    permittee: User = Relationship(
        back_populates="initiated_permits",
        sa_relationship_kwargs={"foreign_keys": "[Permit.permittee_id]"}
    )
    authorizer: Optional[User] = Relationship(
        back_populates="authorized_permits",
        sa_relationship_kwargs={"foreign_keys": "[Permit.authorizer_id]"}
    )
    approver: Optional[User] = Relationship(
        back_populates="approved_permits",
        sa_relationship_kwargs={"foreign_keys": "[Permit.approver_id]"}
    )
    
    # --- NEW Relationships to related tables ---
    ppes: List["PermitPPE"] = Relationship(back_populates="permit")
    attendees: List["PermitAttendee"] = Relationship(back_populates="permit")
# --- END NEW ---
