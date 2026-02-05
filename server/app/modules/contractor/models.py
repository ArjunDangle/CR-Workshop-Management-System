from typing import List, Optional
from uuid import UUID, uuid4
from datetime import date, datetime
from enum import StrEnum
from sqlmodel import Field, Relationship, SQLModel


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


class Contractor(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    company_name: str = Field(unique=True, index=True)
    vendor_code: str = Field(unique=True, index=True)
    status: ContractorStatus = Field(default=ContractorStatus.ACTIVE)
    contractor_type: ContractorType
    safety_rating: int = Field(default=100, ge=0, le=100)
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str] = None
    insurance_valid_upto: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    workers: List["Worker"] = Relationship(back_populates="contractor")
    audit_trail: List["ContractorAudit"] = Relationship(back_populates="contractor")
    incidents: List["Incident"] = Relationship(back_populates="contractor")


class Worker(SQLModel, table=True):
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
    
    contractor: Contractor = Relationship(back_populates="workers")
    permit_links: List["PermitWorkerLink"] = Relationship(back_populates="worker")


class ContractorAudit(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    contractor_id: UUID = Field(foreign_key="contractor.id")
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    contractor: Contractor = Relationship(back_populates="audit_trail")