from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date
from sqlmodel import Field, Relationship, SQLModel

class Shop(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    code: str = Field(index=True, unique=True) 
    machines: List["Machine"] = Relationship(back_populates="shop")

class MachineType(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    machines: List["Machine"] = Relationship(back_populates="type")
    maintenance_plans: List["MaintenancePlan"] = Relationship(back_populates="machine_type")

class Machine(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    asset_id: str = Field(index=True, unique=True)
    name: str 
    status: str = Field(default="OPERATIONAL")
    criticality: str 
    last_maintenance_date: Optional[date] = None
    install_year: Optional[int] = None
    
    # --- NEW: Passport & Zone Fields ---
    workspace_zone: str = Field(default="General Workshop")
    weight_capacity: str = Field(default="Standard")
    power_source: str = Field(default="415V 3-Phase AC")
    competency_required: str = Field(default="SKILLED") # Links to WorkerSkill

    shop_id: UUID = Field(foreign_key="shop.id")
    type_id: UUID = Field(foreign_key="machinetype.id")
    image_url: str | None = Field(default=None) 

    shop: Shop = Relationship(back_populates="machines")
    type: MachineType = Relationship(back_populates="machines")
    incidents: List["Incident"] = Relationship(back_populates="machine")

class MaintenancePlan(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str 
    frequency: str 
    machine_type_id: UUID = Field(foreign_key="machinetype.id")
    machine_type: MachineType = Relationship(back_populates="maintenance_plans")
    tasks: List["MaintenanceTask"] = Relationship(back_populates="plan")

class MaintenanceTask(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    description: str 
    is_critical: bool = Field(default=False)
    requires_ppe: bool = Field(default=False)
    plan_id: UUID = Field(foreign_key="maintenanceplan.id")
    plan: MaintenancePlan = Relationship(back_populates="tasks")