# FILE: server/app/modules/contractor/models.py
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import date, datetime
from enum import StrEnum
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models import PermitWorkerLink, Permit
    from app.modules.incident.models import Incident

# --- Existing Enums ---
class ContractorStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BLACKLISTED = "BLACKLISTED"

class ContractorType(StrEnum):
    OEM = "OEM"
    MSME = "MSME"
    LOCAL = "LOCAL"

class WorkerSkill(StrEnum):
    SKILLED = "SKILLED"
    SEMI_SKILLED = "SEMI_SKILLED"
    UNSKILLED = "UNSKILLED"
    SPECIALIST = "SPECIALIST"

class WorkerTrade(StrEnum):
    ELECTRICIAN = "ELECTRICIAN"
    FITTER = "FITTER"
    WELDER = "WELDER"
    RIGGER = "RIGGER"
    HELPER = "HELPER"

# --- New Enums for Deep Module Expansion ---
class EmpanelmentCategory(StrEnum):
    ELECTRICAL = "ELECTRICAL"
    MECHANICAL = "MECHANICAL"
    CIVIL = "CIVIL"
    GENERAL = "GENERAL"

class ContractStatus(StrEnum):
    TENDER_ISSUED = "TENDER_ISSUED"
    EMPANELLED = "EMPANELLED"
    DRAFTED = "DRAFTED"
    LEGAL_REVIEW = "LEGAL_REVIEW"
    SIGNED = "SIGNED"
    ACTIVE = "ACTIVE"
    EXTENSION_REQUESTED = "EXTENSION_REQUESTED"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"
    CLOSED = "CLOSED"

class ObligationType(StrEnum):
    PF_ESI = "PF_ESI"
    TOOLBOX_TALK = "TOOLBOX_TALK"
    WAGE_RECORD = "WAGE_RECORD"
    SAFETY_MEETING = "SAFETY_MEETING"
    INSPECTION = "INSPECTION"

class ObligationStatus(StrEnum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    VERIFIED = "VERIFIED"
    OVERDUE = "OVERDUE"

class GatePassState(StrEnum):
    INSIDE = "INSIDE"
    OUTSIDE = "OUTSIDE"
    DENIED = "DENIED"

class ChecklistPhase(StrEnum):
    MOBILIZATION = "MOBILIZATION"
    DEMOBILIZATION = "DEMOBILIZATION"

# --- Models ---

class Contractor(SQLModel, table=True):
    """Company Profile Level"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    company_name: str = Field(unique=True, index=True)
    vendor_code: str = Field(unique=True, index=True)
    status: ContractorStatus = Field(default=ContractorStatus.ACTIVE)
    contractor_type: ContractorType
    safety_rating: int = Field(default=100, ge=0, le=100) # Legacy score
    
    # New Profile Extensions
    reputation_score: float = Field(default=100.0) # Dynamic calculated score
    empanelment_category: EmpanelmentCategory = Field(default=EmpanelmentCategory.GENERAL)
    is_watchlist: bool = Field(default=False)
    
    # Subcontractor Hierarchy (Self-Referential)
    parent_contractor_id: Optional[UUID] = Field(default=None, foreign_key="contractor.id")
    
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str] = None
    insurance_valid_upto: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    parent_contractor: Optional["Contractor"] = Relationship(
        back_populates="subcontractors",
        sa_relationship_kwargs=dict(remote_side="Contractor.id")
    )
    subcontractors: List["Contractor"] = Relationship(back_populates="parent_contractor")
    
    contracts: List["Contract"] = Relationship(back_populates="contractor")
    workers: List["Worker"] = Relationship(back_populates="contractor")
    audit_trail: List["ContractorAudit"] = Relationship(back_populates="contractor")
    incidents: List["Incident"] = Relationship(back_populates="contractor")


class Contract(SQLModel, table=True):
    """The specific Job/Tender Level"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contractor_id: UUID = Field(foreign_key="contractor.id", index=True)
    tender_number: str = Field(unique=True, index=True)
    name: str
    description: Optional[str] = None
    status: ContractStatus = Field(default=ContractStatus.TENDER_ISSUED)
    
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[float] = None
    
    # Safety Firewalls
    mobilization_progress: float = Field(default=0.0) # 0 to 100%
    demobilization_progress: float = Field(default=0.0) # 0 to 100%
    
    # Relationships
    contractor: Contractor = Relationship(back_populates="contracts")
    obligations: List["ContractObligation"] = Relationship(back_populates="contract")
    checklists: List["ContractChecklist"] = Relationship(back_populates="contract")
    permits: List["Permit"] = Relationship(back_populates="contract")


class Worker(SQLModel, table=True):
    """Individual Personnel Registry"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contractor_id: UUID = Field(foreign_key="contractor.id")
    full_name: str
    id_proof_number: str = Field(unique=True)
    skill_category: WorkerSkill
    trade: WorkerTrade
    is_blacklisted: bool = Field(default=False)
    medical_valid_upto: date
    safety_training_valid_upto: date
    photo_url: Optional[str] = None
    
    # New Deep Worker Fields
    gate_pass_state: GatePassState = Field(default=GatePassState.OUTSIDE)
    medical_fitness_category: Optional[str] = Field(default=None) # e.g. A1, B1
    safety_induction_date: Optional[date] = None
    safety_induction_score: Optional[int] = None
    
    # Relationships
    contractor: Contractor = Relationship(back_populates="workers")
    permit_links: List["PermitWorkerLink"] = Relationship(back_populates="worker")
    certifications: List["WorkerCertification"] = Relationship(back_populates="worker")
    gate_passes: List["GatePass"] = Relationship(back_populates="worker")


class WorkerCertification(SQLModel, table=True):
    """Stores multiple certs per worker"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    worker_id: UUID = Field(foreign_key="worker.id", index=True)
    certification_name: str
    issuing_authority: str
    issue_date: date
    expiry_date: Optional[date] = None
    
    worker: Worker = Relationship(back_populates="certifications")


class GatePass(SQLModel, table=True):
    """Tracks physical entry/exit into the workshop"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    worker_id: UUID = Field(foreign_key="worker.id", index=True)
    entry_time: datetime = Field(default_factory=datetime.utcnow)
    exit_time: Optional[datetime] = None
    scanned_by_id: Optional[UUID] = None # User who scanned them in
    status: str = Field(default="APPROVED") # APPROVED, DENIED
    denial_reason: Optional[str] = None
    
    worker: Worker = Relationship(back_populates="gate_passes")


class ContractObligation(SQLModel, table=True):
    """Recurring compliance tasks (PF/ESI, Toolbox talks)"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contract_id: UUID = Field(foreign_key="contract.id", index=True)
    title: str
    description: Optional[str] = None
    type: ObligationType
    due_date: date
    status: ObligationStatus = Field(default=ObligationStatus.PENDING)
    submitted_at: Optional[datetime] = None
    verified_by_id: Optional[UUID] = None
    document_url: Optional[str] = None
    
    contract: Contract = Relationship(back_populates="obligations")


class ContractChecklist(SQLModel, table=True):
    """Mob/Demob milestone items"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contract_id: UUID = Field(foreign_key="contract.id", index=True)
    phase: ChecklistPhase
    task_name: str
    is_completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[UUID] = None
    
    contract: Contract = Relationship(back_populates="checklists")


class ContractorAudit(SQLModel, table=True):
    """Maintains backward compatibility for audit logging"""
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contractor_id: UUID = Field(foreign_key="contractor.id")
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    contractor: Contractor = Relationship(back_populates="audit_trail")