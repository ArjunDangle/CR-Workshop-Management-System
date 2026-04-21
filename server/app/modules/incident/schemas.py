# FILE: server/app/modules/incident/schemas.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List

from .models import (
    IncidentSeverity,
    IncidentCategory,
    IncidentStatus,
    CAPAType,
    CAPAStatus,
    ReviewStatus,
    RootCauseCategory
)

# --- Base Schemas ---

class CAPACreate(BaseModel):
    action_description: str
    assigned_to_id: Optional[UUID] = None
    type: CAPAType
    deadline: date
    remarks: Optional[str] = None

class IncidentWitnessCreate(BaseModel):
    witness_name: str
    statement: str
    worker_id: Optional[UUID] = None
    user_id: Optional[UUID] = None

class InvestigationCreate(BaseModel):
    root_cause_category: Optional[RootCauseCategory] = None
    root_cause_analysis: Optional[str] = None
    witness_statements: Optional[str] = None
    conclusion: str

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: IncidentSeverity
    category: IncidentCategory
    occurred_at: datetime
    location_details: str
    
    machine_id: Optional[UUID] = None
    permit_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None
    reported_by_id: Optional[UUID] = None
    
    # --- NEW: Nested Entities for Single-Transaction Reporting ---
    victim_ids: Optional[List[UUID]] = []
    witnesses: Optional[List[IncidentWitnessCreate]] =[]
    investigation: Optional[InvestigationCreate] = None
    capas: Optional[List[CAPACreate]] =[]

# --- Read Schemas (for API responses) ---

class IncidentWitnessRead(BaseModel):
    id: UUID
    witness_name: str
    statement: str
    recorded_at: datetime
    worker_id: Optional[UUID]
    user_id: Optional[UUID]
    model_config = {"from_attributes": True}

class IncidentReviewUpdate(BaseModel):
    review_status: ReviewStatus
    review_remarks: str

class CAPARead(BaseModel):
    id: UUID
    incident_id: UUID
    action_description: str
    assigned_to_id: Optional[UUID]
    type: CAPAType
    status: CAPAStatus
    deadline: date
    completed_at: Optional[datetime]
    remarks: Optional[str]
    model_config = {"from_attributes": True}

class IncidentRead(BaseModel):
    id: UUID
    incident_code: str
    title: str
    description: str
    severity: IncidentSeverity
    category: IncidentCategory
    status: IncidentStatus
    location_details: str
    occurred_at: datetime
    reported_at: datetime
    is_work_stopped: bool
    
    investigation_due_at: Optional[datetime]
    resolved_at: Optional[datetime]
    review_status: ReviewStatus
    review_remarks: Optional[str]
    resolution_permit_id: Optional[UUID]
    reviewed_by_id: Optional[UUID]
    
    machine_id: Optional[UUID]
    permit_id: Optional[UUID]
    contractor_id: Optional[UUID]
    reported_by_id: Optional[UUID]
    
    capa_items: List[CAPARead] = []
    witnesses: List[IncidentWitnessRead] =[]
    
    model_config = {"from_attributes": True}

class IncidentStats(BaseModel):
    total_incidents: int
    open_incidents: int
    investigation_incidents: int
    closed_incidents: int
    major_incidents: int
    fatal_incidents: int
    pending_capas: int
    overdue_capas: int
    days_without_accident: int