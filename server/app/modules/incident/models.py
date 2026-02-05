from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, date
from enum import StrEnum
from sqlmodel import Field, Relationship, SQLModel


class IncidentSeverity(StrEnum):
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    FATAL = "FATAL"


class IncidentCategory(StrEnum):
    UNSAFE_ACT = "UNSAFE_ACT"
    UNSAFE_CONDITION = "UNSAFE_CONDITION"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    PROCEDURE_VIOLATION = "PROCEDURE_VIOLATION"


class IncidentStatus(StrEnum):
    OPEN = "OPEN"
    INVESTIGATION = "INVESTIGATION"
    CLOSED = "CLOSED"
    CAPA_PENDING = "CAPA_PENDING"


class CAPAStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class CAPAType(StrEnum):
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"


class Incident(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str
    severity: IncidentSeverity
    category: IncidentCategory
    status: IncidentStatus = Field(default=IncidentStatus.OPEN)
    incident_date: datetime
    location: str
    reported_by: str
    contact_number: str
    
    # Optional links to other modules
    machine_id: Optional[UUID] = Field(foreign_key="machine.id", default=None)
    permit_id: Optional[UUID] = Field(foreign_key="permit.id", default=None)
    contractor_id: Optional[UUID] = Field(foreign_key="contractor.id", default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    machine: Optional["Machine"] = Relationship(back_populates="incidents")
    permit: Optional["Permit"] = Relationship(back_populates="incidents")
    contractor: Optional["Contractor"] = Relationship(back_populates="incidents")
    capas: List["CAPA"] = Relationship(back_populates="incident", cascade_delete=True)


class CAPA(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    incident_id: UUID = Field(foreign_key="incident.id")
    title: str
    description: str
    type: CAPAType
    status: CAPAStatus = Field(default=CAPAStatus.PENDING)
    assigned_to: str
    due_date: date
    completed_date: Optional[date] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    incident: Incident = Relationship(back_populates="capas")