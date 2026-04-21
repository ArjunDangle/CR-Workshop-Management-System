# FILE: server/app/modules/permit/permit_schemas.py
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List
import datetime

# Import the public-facing User schemas
from app.modules.auth.auth_schemas import UserPublic

# --- MODULE 4 INTEGRATION: Simple Contractor Schema ---
class SimpleContractorRead(BaseModel):
    id: UUID
    company_name: str
    vendor_code: str
    status: str
    model_config = { "from_attributes": True }

# --- Schemas for PermitPPE ---
class PermitPPEBase(BaseModel):
    name: str
    issued_on: Optional[datetime.date] = None
    checked: Optional[bool] = False

class PermitPPECreate(PermitPPEBase):
    pass 

class PermitPPERead(PermitPPEBase):
    id: UUID
    permit_id: UUID
    model_config = { "from_attributes": True }

# --- Schemas for PermitAttendee ---
class PermitAttendeeBase(BaseModel):
    name: str
    phone: str

class PermitAttendeeCreate(PermitAttendeeBase):
    pass 

class PermitAttendeeRead(PermitAttendeeBase):
    id: UUID
    permit_id: UUID
    model_config = { "from_attributes": True }

# --- Main Permit Create Schema ---
class PermitCreate(BaseModel):
    permit_no: Optional[str] = Field(default=None, max_length=100)
    date: Optional[datetime.date] = None
    person_responsible: Optional[str] = Field(default=None, max_length=255)
    work_location: Optional[str] = Field(default=None, max_length=255)
    work_description: Optional[str] = Field(default=None, max_length=500)
    
    start_date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    finish_date: Optional[datetime.date] = None
    finish_time: Optional[datetime.time] = None

    fall_system_description: Optional[str] = Field(default=None)
    fall_does_not_arrest: Optional[str] = Field(default=None) 
    certified_crane_near_ladder: Optional[bool] = Field(default=False)

    on_crane_describe: Optional[str] = Field(default=None)
    other_describe: Optional[str] = Field(default=None)
    hazard_assessed: Optional[bool] = Field(default=False)
    work_can_proceed: Optional[bool] = Field(default=False)

    ppes: List[PermitPPECreate] = Field(default=[])

    method_access_fixed_ladder: Optional[bool] = Field(default=False)
    method_access_elevated_platform: Optional[bool] = Field(default=False)
    method_access_scissor_lift: Optional[bool] = Field(default=False)
    method_access_boom_lifter: Optional[bool] = Field(default=False)
    method_access_catwalk: Optional[bool] = Field(default=False)
    fixed_ladder_other_person_at_foot: Optional[str] = Field(default=None) 
    fixed_ladder_adjustable_lanyard: Optional[str] = Field(default=None) 

    electrical_isolation_obtained: Optional[str] = Field(default=None) 
    isolation_from: Optional[str] = Field(default=None)
    isolation_to: Optional[str] = Field(default=None)
    other_block_required: Optional[bool] = Field(default=False)
    other_block_describe: Optional[str] = Field(default=None)

    authorizer_name: Optional[str] = Field(default=None)
    authorizer_signature_date: Optional[datetime.date] = None
    
    attendees: List[PermitAttendeeCreate] = Field(default=[])
    
    contractor_id: Optional[UUID] = Field(None, description="Contractor ID for this permit")
    worker_ids: List[UUID] = Field(default=[], description="List of worker IDs assigned to this permit")
    machine_id: Optional[UUID] = Field(None)
    maintenance_plan_id: Optional[UUID] = Field(None)

# --- Main Permit Read Schema ---
class PermitRead(BaseModel):
    id: UUID
    permit_type: str
    status: str
    permit_no: Optional[str]
    date: Optional[datetime.date]
    person_responsible: Optional[str]
    work_location: Optional[str]
    work_description: Optional[str]
    
    start_date: Optional[datetime.date]
    start_time: Optional[datetime.time]
    finish_date: Optional[datetime.date]
    finish_time: Optional[datetime.time]

    fall_system_description: Optional[str]
    fall_does_not_arrest: Optional[str]
    certified_crane_near_ladder: Optional[bool]

    on_crane_describe: Optional[str]
    other_describe: Optional[str]
    hazard_assessed: Optional[bool]
    work_can_proceed: Optional[bool]

    method_access_fixed_ladder: Optional[bool]
    method_access_elevated_platform: Optional[bool]
    method_access_scissor_lift: Optional[bool]
    method_access_boom_lifter: Optional[bool]
    method_access_catwalk: Optional[bool]
    fixed_ladder_other_person_at_foot: Optional[str]
    fixed_ladder_adjustable_lanyard: Optional[str]

    electrical_isolation_obtained: Optional[str]
    isolation_from: Optional[str]
    isolation_to: Optional[str]
    other_block_required: Optional[bool]
    other_block_describe: Optional[str]

    authorizer_name: Optional[str]
    authorizer_signature_date: Optional[datetime.date]
    created_at: datetime.datetime
    
    permittee_id: UUID
    permittee: Optional[UserPublic] = None 
    
    authorizer_id: Optional[UUID] = None
    authorized_at: Optional[datetime.datetime] = None
    authorizer: Optional[UserPublic] = None
    
    approver_id: Optional[UUID] = None
    approved_at: Optional[datetime.datetime] = None
    approver_remarks: Optional[str] = None
    approver: Optional[UserPublic] = None
    
    # --- NEW CLOSURE & SIMOPS FIELDS ---
    handback_declaration: Optional[str] = None
    handback_time: Optional[datetime.datetime] = None
    inspection_remarks: Optional[str] = None
    inspector_id: Optional[UUID] = None
    inspector: Optional[UserPublic] = None
    inspection_time: Optional[datetime.datetime] = None
    simops_acknowledged: Optional[bool] = None

    actual_start_time: Optional[datetime.datetime] = None
    actual_end_time: Optional[datetime.datetime] = None
    extension_requested: Optional[bool] = None
    extension_reason: Optional[str] = None
    requested_new_end_time: Optional[datetime.datetime] = None
    
    ppes: List[PermitPPERead] =[]
    attendees: List[PermitAttendeeRead] = []
    
    contractor_id: Optional[UUID] = None
    contractor: Optional[SimpleContractorRead] = None

    model_config = { "from_attributes": True }

# --- Update & Action Schemas ---
class PermitApprove(BaseModel):
    approver_remarks: str = Field(..., max_length=500)
    simops_acknowledged: bool = Field(default=False)

class PermitExtensionRequest(BaseModel):
    extension_reason: str = Field(..., min_length=10, max_length=500)
    requested_new_end_time: datetime.datetime

class PermitHandback(BaseModel):
    handback_declaration: str = Field(..., min_length=10, max_length=1500)

class PermitVerifyClosure(BaseModel):
    inspection_remarks: str = Field(..., min_length=10, max_length=1500)

class PermitConflictItem(BaseModel):
    permit_id: UUID
    permit_no: Optional[str]
    conflict_type: str
    description: str

class PermitConflictReport(BaseModel):
    has_conflicts: bool
    conflicts: List[PermitConflictItem]