from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date
from sqlmodel import Field, Relationship, SQLModel

# --- 1. Shop ---
class Shop(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    code: str = Field(index=True, unique=True) 
    
    machines: List["Machine"] = Relationship(back_populates="shop")

# --- 2. MachineType ---
class MachineType(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    
    machines: List["Machine"] = Relationship(back_populates="type")
    maintenance_plans: List["MaintenancePlan"] = Relationship(back_populates="machine_type")

# --- 3. Machine ---
class Machine(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    asset_id: str = Field(index=True, unique=True)
    name: str 
    status: str = Field(default="OPERATIONAL")
    criticality: str 
    last_maintenance_date: Optional[date] = None
    install_year: Optional[int] = None

    shop_id: UUID = Field(foreign_key="shop.id")
    type_id: UUID = Field(foreign_key="machinetype.id")

    shop: Shop = Relationship(back_populates="machines")
    type: MachineType = Relationship(back_populates="machines")
    incidents: List["Incident"] = Relationship(back_populates="machine")

# --- 4. MaintenancePlan ---
class MaintenancePlan(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str 
    frequency: str 
    
    machine_type_id: UUID = Field(foreign_key="machinetype.id")
    
    machine_type: MachineType = Relationship(back_populates="maintenance_plans")
    tasks: List["MaintenanceTask"] = Relationship(back_populates="plan")

# --- 5. MaintenanceTask ---
class MaintenanceTask(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    description: str 
    is_critical: bool = Field(default=False)
    requires_ppe: bool = Field(default=False)
    
    plan_id: UUID = Field(foreign_key="maintenanceplan.id")
    
    plan: MaintenancePlan = Relationship(back_populates="tasks")