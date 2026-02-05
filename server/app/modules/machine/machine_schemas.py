from uuid import UUID
from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from uuid import UUID, uuid4


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
    image_url: str | None = None
    manufacturer: str | None = None
    model_name: str | None = None
    install_year: int | None = None
    last_maintenance_date: date | None = None
    
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