from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship

# --- 0. PREVENT CIRCULAR IMPORTS (Fixes Pylance Errors) ---
if TYPE_CHECKING:
    # These imports run ONLY during type checking, never at runtime
    from app.modules.machine.machine_models import Machine
    from app.modules.contractor.models import Contractor
    from app.modules.permit.models import Permit
    from app.models import User 

# ==========================================
# 1. ENUMS (Consolidated at Top)
# ==========================================

class IncidentSeverity(str, Enum):
    NEAR_MISS = "NEAR_MISS"
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    FATAL = "FATAL"
    CRITICAL = "CRITICAL" # Added for robustness

class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATION_PENDING = "INVESTIGATION_PENDING"
    CAPA_PENDING = "CAPA_PENDING"
    CLOSED = "CLOSED"
    INVESTIGATING = "INVESTIGATING" # Alias often used

class IncidentCategory(str, Enum):
    # This was missing and causing ImportErrors
    ELECTRICAL = "ELECTRICAL"
    MECHANICAL = "MECHANICAL"
    CIVIL = "CIVIL"
    FIRE = "FIRE"
    CHEMICAL = "CHEMICAL"
    GENERAL = "GENERAL"
    UNSAFE_ACT = "UNSAFE_ACT"
    UNSAFE_CONDITION = "UNSAFE_CONDITION"

class RootCauseCategory(str, Enum):
    MAN = "MAN"
    MACHINE = "MACHINE"
    METHOD = "METHOD"
    MATERIAL = "MATERIAL"
    ENVIRONMENT = "ENVIRONMENT"

class InvestigationStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class CAPAStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class CAPAType(str, Enum):
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"

# ==========================================
# 2. MODELS
# ==========================================

class IncidentBase(SQLModel):
    incident_code: str = Field(unique=True, index=True)
    severity: IncidentSeverity
    category: IncidentCategory = Field(default=IncidentCategory.GENERAL) # Added missing field
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
    # These contain data belonging TO this incident
    victims: List["IncidentVictim"] = Relationship(back_populates="incident")
    investigation: Optional["Investigation"] = Relationship(back_populates="incident")
    capa_items: List["CAPA"] = Relationship(back_populates="incident")

    # --- 2. Upstream Relationships (Parents) ---
    # We use string forward references to avoid circular imports.
    # The 'back_populates' should match the definitions in those respective files.
    # If those files don't have the relationship defined yet, SQLModel will ignore the back link.
    machine: Optional["Machine"] = Relationship(back_populates="incidents")
    contractor: Optional["Contractor"] = Relationship(back_populates="incidents")
    permit: Optional["Permit"] = Relationship(back_populates="incidents")
    reported_by: Optional["User"] = Relationship(back_populates="reported_incidents")

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
    status: InvestigationStatus = Field(default=InvestigationStatus.PENDING) # Added status
    
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
    
    # Upgraded from boolean to Enums for better tracking
    type: CAPAType = Field(default=CAPAType.CORRECTIVE)
    status: CAPAStatus = Field(default=CAPAStatus.PENDING)
    
    deadline: date
    completed_at: Optional[datetime] = None
    remarks: Optional[str] = None

    incident: Incident = Relationship(back_populates="capa_items")