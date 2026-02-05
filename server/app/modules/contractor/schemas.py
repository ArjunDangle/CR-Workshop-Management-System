from typing import Optional
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.modules.contractor.models import (
    ContractorStatus, 
    ContractorType, 
    WorkerSkill, 
    WorkerTrade
)


class ContractorCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    vendor_code: str = Field(..., min_length=1, max_length=50)
    contractor_type: ContractorType
    safety_rating: int = Field(default=100, ge=0, le=100)
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str] = Field(None, max_length=100)
    insurance_valid_upto: Optional[date] = None


class ContractorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    vendor_code: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[ContractorStatus] = None
    contractor_type: Optional[ContractorType] = None
    safety_rating: Optional[int] = Field(None, ge=0, le=100)
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
    empanelment_valid_upto: date
    insurance_policy_no: Optional[str]
    insurance_valid_upto: Optional[date]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class WorkerCreate(BaseModel):
    contractor_id: UUID
    full_name: str = Field(..., min_length=1, max_length=255)
    id_proof_number: str = Field(..., min_length=1, max_length=100)
    skill_category: WorkerSkill
    trade: WorkerTrade
    medical_valid_upto: date
    safety_training_valid_upto: date
    photo_url: Optional[str] = Field(None, max_length=500)


class WorkerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    skill_category: Optional[WorkerSkill] = None
    trade: Optional[WorkerTrade] = None
    is_blacklisted: Optional[bool] = None
    medical_valid_upto: Optional[date] = None
    safety_training_valid_upto: Optional[date] = None
    photo_url: Optional[str] = Field(None, max_length=500)


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
    photo_url: Optional[str]
    
    model_config = {"from_attributes": True}


class WorkerValidationResult(BaseModel):
    is_eligible: bool
    reason: Optional[str] = None


class ContractorAuditRead(BaseModel):
    id: UUID
    contractor_id: UUID
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: Optional[str]
    timestamp: datetime
    
    model_config = {"from_attributes": True}