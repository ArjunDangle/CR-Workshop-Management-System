from typing import Optional, List
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

# --- Enums ---
class IncidentSeverity(str, Enum):
    NEAR_MISS = "NEAR_MISS"
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    FATAL = "FATAL"

class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATION_PENDING = "INVESTIGATION_PENDING"
    CAPA_PENDING = "CAPA_PENDING"
    CLOSED = "CLOSED"

class RootCauseCategory(str, Enum):
    MAN = "MAN"
    MACHINE = "MACHINE"
    METHOD = "METHOD"
    MATERIAL = "MATERIAL"
    ENVIRONMENT = "ENVIRONMENT"

# --- Models ---

class IncidentBase(SQLModel):
    incident_code: str = Field(unique=True, index=True)
    severity: IncidentSeverity
    title: str
    description: str
    location_details: str
    occurred_at: datetime
    reported_at: datetime = Field(default_factory=datetime.now)
    status: IncidentStatus = Field(default=IncidentStatus.OPEN)
    is_work_stopped: bool = Field(default=False)
    
    # Foreign Keys
    permit_id: Optional[UUID] = Field(default=None, foreign_key="permit.id")
    machine_id: Optional[UUID] = Field(default=None, foreign_key="machine.id")
    contractor_id: Optional[UUID] = Field(default=None, foreign_key="contractor.id")
    reported_by_id: Optional[UUID] = Field(default=None, foreign_key="user.id")

class Incident(IncidentBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # --- 1. Downstream Relationships (Children) ---
    victims: List["IncidentVictim"] = Relationship(back_populates="incident")
    investigation: Optional["Investigation"] = Relationship(back_populates="incident")
    capa_items: List["CAPA"] = Relationship(back_populates="incident")

    # --- 2. Upstream Relationships (Parents) ---
    # These were missing and causing the "Mapper has no property" error
    # We use string forward references to avoid circular imports
    machine: Optional["Machine"] = Relationship() 
    contractor: Optional["Contractor"] = Relationship()
    permit: Optional["Permit"] = Relationship()
    reported_by: Optional["User"] = Relationship()

class IncidentVictim(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    incident_id: UUID = Field(foreign_key="incident.id")
    worker_id: Optional[UUID] = Field(default=None, foreign_key="worker.id")
    full_name: str
    injury_details: str
    hospitalized: bool = Field(default=False)

    incident: Incident = Relationship(back_populates="victims")

class Investigation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    incident_id: UUID = Field(foreign_key="incident.id")
    investigated_by_id: Optional[UUID] = Field(default=None, foreign_key="user.id")
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    root_cause_category: Optional[RootCauseCategory] = None
    root_cause_analysis: Optional[str] = None
    witness_statements: Optional[str] = None
    conclusion: Optional[str] = None
    evidence_photos_url: Optional[str] = None 

    incident: Incident = Relationship(back_populates="investigation")

class CAPA(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    incident_id: UUID = Field(foreign_key="incident.id")
    action_description: str
    assigned_to_id: Optional[UUID] = Field(default=None, foreign_key="user.id")
    deadline: date
    completed_at: Optional[datetime] = None
    is_completed: bool = Field(default=False)
    remarks: Optional[str] = None

    incident: Incident = Relationship(back_populates="capa_items")