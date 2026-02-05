from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List

from .models import (
    IncidentSeverity,
    IncidentCategory,
    IncidentStatus,
    CAPAType,
    CAPAStatus
)

# --- Base Schemas ---

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: IncidentSeverity
    category: IncidentCategory
    occurred_at: datetime
    location_details: str
    
    # Optional linked entities
    machine_id: Optional[UUID] = None
    permit_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None
    reported_by_id: Optional[UUID] = None # Should be set by current user

class CAPACreate(BaseModel):
    action_description: str
    assigned_to_id: Optional[UUID] = None
    type: CAPAType
    deadline: date
    remarks: Optional[str] = None

# --- Read Schemas (for API responses) ---

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
    
    machine_id: Optional[UUID]
    permit_id: Optional[UUID]
    contractor_id: Optional[UUID]
    reported_by_id: Optional[UUID]
    
    capa_items: List[CAPARead] = []
    
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