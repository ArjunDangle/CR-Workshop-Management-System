from uuid import UUID
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

# --- Read Schemas ---

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
    last_maintenance_date: Optional[date]
    shop_id: UUID
    shop_name: Optional[str] = None # <-- ADD THIS
    type_id: UUID
    
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
    tasks: List[MaintenanceTaskRead] = []