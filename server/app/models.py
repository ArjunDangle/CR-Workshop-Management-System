# FILE: server/app/models.py
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
import datetime

from sqlmodel import Field, Relationship, SQLModel 
from sqlalchemy import Column, Date, Time

if TYPE_CHECKING:
    from app.modules.machine.machine_models import Machine, MaintenancePlan
    from app.modules.contractor.models import Contractor, Worker
    from app.modules.incident.models import Incident


# --- Role Model ---
class RoleBase(SQLModel):
    name: str = Field(index=True, unique=True, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    parent_id: Optional[UUID] = Field(default=None, foreign_key="role.id", index=True)

class Role(RoleBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    parent: Optional["Role"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Role.id"}
    )
    children: List["Role"] = Relationship(back_populates="parent")
    users: List["User"] = Relationship(back_populates="role")

class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    id: UUID

class RoleReadWithChildren(RoleRead):
     children: List["RoleRead"] =[]

class RoleUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


# --- User Model ---
class UserBase(SQLModel):
    email: str = Field(index=True, unique=True, max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)
    role_id: UUID = Field(foreign_key="role.id", index=True)

class User(UserBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str = Field(index=True) 

    role: "Role" = Relationship(back_populates="users")

    initiated_permits: List["Permit"] = Relationship(
        back_populates="permittee",
        sa_relationship_kwargs={"primaryjoin": "User.id==Permit.permittee_id"}
    )
    authorized_permits: List["Permit"] = Relationship(
        back_populates="authorizer",
        sa_relationship_kwargs={"primaryjoin": "User.id==Permit.authorizer_id"}
    )
    approved_permits: List["Permit"] = Relationship(
        back_populates="approver",
        sa_relationship_kwargs={"primaryjoin": "User.id==Permit.approver_id"}
    )
    inspected_permits: List["Permit"] = Relationship(
        back_populates="inspector",
        sa_relationship_kwargs={"primaryjoin": "User.id==Permit.inspector_id"}
    )
    
    # Incident Relationship Fixed
    reported_incidents: List["Incident"] = Relationship(
        back_populates="reported_by",
        sa_relationship_kwargs={"primaryjoin": "User.id==Incident.reported_by_id"}
    )

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


# --- Permit Sub-Models ---
class PermitPPE(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    permit_id: UUID = Field(foreign_key="permit.id", index=True)
    name: str
    issued_on: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    checked: Optional[bool] = Field(default=False)
    permit: "Permit" = Relationship(back_populates="ppes")

class PermitAttendee(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    permit_id: UUID = Field(foreign_key="permit.id", index=True)
    name: str
    phone: str
    permit: "Permit" = Relationship(back_populates="attendees")

class PermitWorkerLink(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    permit_id: UUID = Field(foreign_key="permit.id", index=True)
    worker_id: UUID = Field(foreign_key="worker.id", index=True)
    role: str = Field(max_length=100)
    permit: "Permit" = Relationship(back_populates="worker_links")
    worker: "Worker" = Relationship(back_populates="permit_links")


# --- Permit Model ---
class PermitBase(SQLModel):
    permit_type: str = Field(index=True, max_length=50)
    status: str = Field(default="Pending Authorization", index=True, max_length=50)
    
    permit_no: Optional[str] = Field(default=None, max_length=100, index=True)
    date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    person_responsible: Optional[str] = Field(default=None, max_length=255)
    work_location: Optional[str] = Field(default=None, max_length=255)
    work_description: Optional[str] = Field(default=None, max_length=500)
    
    start_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    start_time: Optional[datetime.time] = Field(default=None, sa_column=Column(Time))
    finish_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    finish_time: Optional[datetime.time] = Field(default=None, sa_column=Column(Time))

    fall_system_description: Optional[str] = Field(default=None)
    fall_does_not_arrest: Optional[str] = Field(default=None)
    certified_crane_near_ladder: Optional[bool] = Field(default=False)

    on_crane_describe: Optional[str] = Field(default=None)
    other_describe: Optional[str] = Field(default=None)
    hazard_assessed: Optional[bool] = Field(default=False)
    work_can_proceed: Optional[bool] = Field(default=False)

    method_access_fixed_ladder: Optional[bool] = Field(default=False)
    method_access_elevated_platform: Optional[bool] = Field(default=False)
    method_access_scissor_lift: Optional[bool] = Field(default=False)
    method_access_boom_lifter: Optional[bool] = Field(default=False)
    method_access_catwalk: Optional[bool] = Field(default=False)
    fixed_ladder_other_person_at_foot: Optional[str] = Field(default=None)
    fixed_ladder_adjustable_lanyard: Optional[str] = Field(default=None)

    electrical_isolation_obtained: Optional[str] = Field(default=None)
    isolation_from: Optional[str] = Field(default=None)
    isolation_to: Optional[str] = Field(default=None)
    other_block_required: Optional[bool] = Field(default=False)
    other_block_describe: Optional[str] = Field(default=None)

    authorizer_name: Optional[str] = Field(default=None)
    authorizer_signature_date: Optional[datetime.date] = Field(default=None, sa_column=Column(Date))
    
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    permittee_id: UUID = Field(foreign_key="user.id", index=True)
    authorizer_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    authorized_at: Optional[datetime.datetime] = Field(default=None)
    
    approver_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    approved_at: Optional[datetime.datetime] = Field(default=None)
    approver_remarks: Optional[str] = Field(default=None, max_length=500)
    
    actual_start_time: Optional[datetime.datetime] = Field(default=None)
    actual_end_time: Optional[datetime.datetime] = Field(default=None)
    extension_requested: Optional[bool] = Field(default=False, index=True)
    extension_reason: Optional[str] = Field(default=None, max_length=500)
    requested_new_end_time: Optional[datetime.datetime] = Field(default=None)
    
    machine_id: Optional[UUID] = Field(default=None, foreign_key="machine.id", index=True)
    maintenance_plan_id: Optional[UUID] = Field(default=None, foreign_key="maintenanceplan.id")
    is_critical: bool = Field(default=False)
    contractor_id: Optional[UUID] = Field(default=None, foreign_key="contractor.id", index=True)

    handback_declaration: Optional[str] = Field(default=None, max_length=1500)
    handback_time: Optional[datetime.datetime] = Field(default=None)
    
    inspection_remarks: Optional[str] = Field(default=None, max_length=1500)
    inspector_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    inspection_time: Optional[datetime.datetime] = Field(default=None)
    
    simops_acknowledged: Optional[bool] = Field(default=False)

class Permit(PermitBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

    permittee: "User" = Relationship(
        back_populates="initiated_permits",
        sa_relationship_kwargs={"primaryjoin": "Permit.permittee_id==User.id"}
    )
    authorizer: Optional["User"] = Relationship(
        back_populates="authorized_permits",
        sa_relationship_kwargs={"primaryjoin": "Permit.authorizer_id==User.id"}
    )
    approver: Optional["User"] = Relationship(
        back_populates="approved_permits",
        sa_relationship_kwargs={"primaryjoin": "Permit.approver_id==User.id"}
    )
    inspector: Optional["User"] = Relationship(
        back_populates="inspected_permits",
        sa_relationship_kwargs={"primaryjoin": "Permit.inspector_id==User.id"}
    )
    
    ppes: List["PermitPPE"] = Relationship(back_populates="permit")
    attendees: List["PermitAttendee"] = Relationship(back_populates="permit")
    
    machine: Optional["Machine"] = Relationship(
        sa_relationship_kwargs={"primaryjoin": "Permit.machine_id==Machine.id", "lazy": "selectin"}
    )
    maintenance_plan: Optional["MaintenancePlan"] = Relationship(
        sa_relationship_kwargs={"primaryjoin": "Permit.maintenance_plan_id==MaintenancePlan.id", "lazy": "selectin"}
    )
    contractor: Optional["Contractor"] = Relationship(
        sa_relationship_kwargs={"primaryjoin": "Permit.contractor_id==Contractor.id", "lazy": "selectin"}
    )
    worker_links: List["PermitWorkerLink"] = Relationship(back_populates="permit")
    
    # Incident Relationship Fixed
    incidents: List["Incident"] = Relationship(
        back_populates="permit",
        sa_relationship_kwargs={"primaryjoin": "Permit.id==Incident.permit_id"}
    )