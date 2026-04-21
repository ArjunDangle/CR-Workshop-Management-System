# FILE: server/app/modules/contractor/schemas.py
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.modules.contractor.models import (
    ContractorStatus, 
    ContractorType, 
    WorkerSkill, 
    WorkerTrade,
    EmpanelmentCategory,
    ContractStatus,
    ObligationType,
    ObligationStatus,
    GatePassState,
    ChecklistPhase
)

# --- 1. CONTRACTOR SCHEMAS ---
class ContractorCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    vendor_code: str = Field(..., min_length=1, max_length=50)
    contractor_type: ContractorType
    empanelment_category: EmpanelmentCategory = Field(default=EmpanelmentCategory.GENERAL)
    parent_contractor_id: Optional[UUID] = None  # For Subcontractors
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str] = Field(None, max_length=100)
    insurance_valid_upto: Optional[date] = None

class ContractorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[ContractorStatus] = None
    empanelment_category: Optional[EmpanelmentCategory] = None
    is_watchlist: Optional[bool] = None
    empanelment_valid_upto: Optional[date] = None
    insurance_policy_no: Optional[str] = Field(None, max_length=100)
    insurance_valid_upto: Optional[date] = None

class ContractorStatusUpdate(BaseModel):
    status: ContractorStatus
    reason: str = Field(..., min_length=5, max_length=500)

class ContractorRead(BaseModel):
    id: UUID
    company_name: str
    vendor_code: str
    status: ContractorStatus
    contractor_type: ContractorType
    safety_rating: int
    reputation_score: float
    empanelment_category: EmpanelmentCategory
    is_watchlist: bool
    parent_contractor_id: Optional[UUID]
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str]
    insurance_valid_upto: Optional[date]
    created_at: datetime
    model_config = {"from_attributes": True}

class ContractorTreeRead(ContractorRead):
    subcontractors: List["ContractorRead"] =[]

# --- 2. CONTRACT SCHEMAS (New) ---
class ContractCreate(BaseModel):
    contractor_id: UUID
    tender_number: str
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[float] = None

class ContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ContractChecklistRead(BaseModel):
    id: UUID
    phase: ChecklistPhase
    task_name: str
    is_completed: bool
    completed_at: Optional[datetime]
    model_config = {"from_attributes": True}

class ContractObligationRead(BaseModel):
    id: UUID
    title: str
    type: ObligationType
    due_date: date
    status: ObligationStatus
    document_url: Optional[str]
    model_config = {"from_attributes": True}

class ContractRead(BaseModel):
    id: UUID
    contractor_id: UUID
    tender_number: str
    name: str
    status: ContractStatus
    start_date: Optional[date]
    end_date: Optional[date]
    mobilization_progress: float
    demobilization_progress: float
    checklists: List[ContractChecklistRead] =[]
    obligations: List[ContractObligationRead] =[]
    model_config = {"from_attributes": True}

# --- 3. WORKER SCHEMAS ---
class WorkerCertificationCreate(BaseModel):
    certification_name: str
    issuing_authority: str
    issue_date: date
    expiry_date: Optional[date] = None

class WorkerCertificationRead(WorkerCertificationCreate):
    id: UUID
    worker_id: UUID
    model_config = {"from_attributes": True}

class WorkerCreate(BaseModel):
    contractor_id: UUID
    full_name: str = Field(..., min_length=1, max_length=255)
    id_proof_number: str = Field(..., min_length=1, max_length=100)
    skill_category: WorkerSkill
    trade: WorkerTrade
    medical_valid_upto: date
    safety_training_valid_upto: date
    medical_fitness_category: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)

class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    skill_category: Optional[WorkerSkill] = None
    trade: Optional[WorkerTrade] = None
    is_blacklisted: Optional[bool] = None
    medical_valid_upto: Optional[date] = None
    safety_training_valid_upto: Optional[date] = None
    photo_url: Optional[str] = None

class WorkerRead(BaseModel):
    id: UUID
    contractor_id: UUID
    contractor_name: Optional[str] = None
    full_name: str
    id_proof_number: str
    skill_category: WorkerSkill
    trade: WorkerTrade
    is_blacklisted: bool
    medical_valid_upto: date
    safety_training_valid_upto: date
    gate_pass_state: GatePassState
    medical_fitness_category: Optional[str]
    safety_induction_date: Optional[date]
    safety_induction_score: Optional[int]
    photo_url: Optional[str]
    certifications: List[WorkerCertificationRead] =[]
    model_config = {"from_attributes": True}

class WorkerValidationResult(BaseModel):
    is_eligible: bool
    reason: Optional[str] = None

# --- 4. GATE PASS SCHEMAS (New) ---
class GatePassScan(BaseModel):
    direction: str = Field(..., description="'IN' or 'OUT'")

class GatePassRead(BaseModel):
    id: UUID
    worker_id: UUID
    entry_time: datetime
    exit_time: Optional[datetime]
    status: str
    denial_reason: Optional[str]
    model_config = {"from_attributes": True}

class ContractorAuditRead(BaseModel):
    id: UUID
    contractor_id: UUID
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: Optional[str]
    timestamp: datetime
    model_config = {"from_attributes": True}