from uuid import UUID
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

class ShopRead(BaseModel):
    id: UUID
    name: str
    code: str

class MachineTypeRead(BaseModel):
    id: UUID
    name: str

class MachineRead(BaseModel):
    id: UUID
    asset_id: str
    name: str
    status: str
    criticality: str
    last_maintenance_date: Optional[date] = None
    shop_id: UUID
    shop_name: Optional[str] = None 
    type_id: UUID
    image_url: str | None = None
    manufacturer: str | None = None
    model_name: str | None = None
    install_year: int | None = None
    
    # New Passport Fields
    workspace_zone: str
    weight_capacity: str
    power_source: str
    competency_required: str
    
    class Config:
        from_attributes = True

class MaintenanceTaskRead(BaseModel):
    id: UUID
    description: str
    is_critical: bool
    requires_ppe: bool

class MaintenancePlanRead(BaseModel):
    id: UUID
    title: str
    frequency: str
    tasks: List[MaintenanceTaskRead] =[]

# --- NEW: Passport Aggregation Schemas ---

class TimelineEvent(BaseModel):
    event_date: datetime
    event_type: str # "PERMIT", "INCIDENT", "MAINTENANCE"
    title: str
    description: Optional[str]
    status: Optional[str]
    severity: Optional[str] = None
    actor_name: Optional[str] = None

class MachinePassportRead(BaseModel):
    machine: MachineRead
    active_permits: List[dict] # Simplified for frontend rendering
    recent_incidents: List[dict]
    health_timeline: List[TimelineEvent]