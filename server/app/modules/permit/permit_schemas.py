# FILE: server/app/modules/permit/permit_schemas.py
"""
Pydantic Schemas for the Permit Management Module.
Defines data structures for API requests and responses.
"""
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List, Any
# --- FIX: Import 'datetime' module directly ---
import datetime
# --- END FIX ---

# Import the public-facing User and Role schemas
from app.modules.auth.auth_schemas import UserPublic

# --- Schemas for PermitPPE (One-to-Many) ---

class PermitPPEBase(BaseModel):
    name: str
    # --- FIX: Use datetime.date ---
    issued_on: Optional[datetime.date] = None
    checked: Optional[bool] = False

class PermitPPECreate(PermitPPEBase):
    pass # permit_id will be set by the service

class PermitPPERead(PermitPPEBase):
    id: UUID
    permit_id: UUID
    
    model_config = { "from_attributes": True }

# --- Schemas for PermitAttendee (One-to-Many) ---

class PermitAttendeeBase(BaseModel):
    name: str
    phone: str

class PermitAttendeeCreate(PermitAttendeeBase):
    pass # permit_id will be set by the service

class PermitAttendeeRead(PermitAttendeeBase):
    id: UUID
    permit_id: UUID
    
    model_config = { "from_attributes": True }


# --- Main Permit Create Schema ---
# This schema matches all fields from the form
class PermitCreate(BaseModel):
    # --- Top Section Fields ---
    permit_no: Optional[str] = Field(default=None, max_length=100)
    # --- FIX: Use datetime.date ---
    date: Optional[datetime.date] = None
    person_responsible: Optional[str] = Field(default=None, max_length=255)
    work_location: Optional[str] = Field(default=None, max_length=255)
    work_description: Optional[str] = Field(default=None, max_length=500)
    
    # --- Schedule Section ---
    # --- FIX: Use datetime.date ---
    start_date: Optional[datetime.date] = None
    # --- FIX: Use datetime.time ---
    start_time: Optional[datetime.time] = None
    # --- FIX: Use datetime.date ---
    finish_date: Optional[datetime.date] = None
    # --- FIX: Use datetime.time ---
    finish_time: Optional[datetime.time] = None

    # --- Fall Protection Section ---
    fall_system_description: Optional[str] = Field(default=None)
    fall_does_not_arrest: Optional[str] = Field(default=None) # "yes" or "no"
    certified_crane_near_ladder: Optional[bool] = Field(default=False)

    # --- Work Context Section ---
    on_crane_describe: Optional[str] = Field(default=None)
    other_describe: Optional[str] = Field(default=None)
    hazard_assessed: Optional[bool] = Field(default=False)
    work_can_proceed: Optional[bool] = Field(default=False)

    # --- PPEs Section (Nested List) ---
    ppes: List[PermitPPECreate] = Field(default=[])

    # --- Method of Access Section (Flattened) ---
    method_access_fixed_ladder: Optional[bool] = Field(default=False)
    method_access_elevated_platform: Optional[bool] = Field(default=False)
    method_access_scissor_lift: Optional[bool] = Field(default=False)
    method_access_boom_lifter: Optional[bool] = Field(default=False)
    method_access_catwalk: Optional[bool] = Field(default=False)
    fixed_ladder_other_person_at_foot: Optional[str] = Field(default=None) # Hazard control
    fixed_ladder_adjustable_lanyard: Optional[str] = Field(default=None) # Key control

    # --- Isolation Section ---
    electrical_isolation_obtained: Optional[str] = Field(default=None) # "yes" or "no"
    isolation_from: Optional[str] = Field(default=None)
    isolation_to: Optional[str] = Field(default=None)
    other_block_required: Optional[bool] = Field(default=False)
    other_block_describe: Optional[str] = Field(default=None)

    # --- Authorisation Section (from form) ---
    authorizer_name: Optional[str] = Field(default=None)
    # --- FIX: Use datetime.date ---
    authorizer_signature_date: Optional[datetime.date] = None
    
    # --- Attendees Section (Nested List) ---
    attendees: List[PermitAttendeeCreate] = Field(default=[])


# --- Main Permit Read Schema ---
# This schema defines what the API returns
class PermitRead(BaseModel):
    id: UUID
    permit_type: str
    status: str
    
    # --- Top Section Fields ---
    permit_no: Optional[str]
    # --- FIX: Use datetime.date ---
    date: Optional[datetime.date]
    person_responsible: Optional[str]
    work_location: Optional[str]
    work_description: Optional[str]
    
    # --- Schedule Section ---
    # --- FIX: Use datetime.date ---
    start_date: Optional[datetime.date]
    # --- FIX: Use datetime.time ---
    start_time: Optional[datetime.time]
    # --- FIX: Use datetime.date ---
    finish_date: Optional[datetime.date]
    # --- FIX: Use datetime.time ---
    finish_time: Optional[datetime.time]

    # --- Fall Protection Section ---
    fall_system_description: Optional[str]
    fall_does_not_arrest: Optional[str]
    certified_crane_near_ladder: Optional[bool]

    # --- Work Context Section ---
    on_crane_describe: Optional[str]
    other_describe: Optional[str]
    hazard_assessed: Optional[bool]
    work_can_proceed: Optional[bool]

    # --- Method of Access Section (Flattened) ---
    method_access_fixed_ladder: Optional[bool]
    method_access_elevated_platform: Optional[bool]
    method_access_scissor_lift: Optional[bool]
    method_access_boom_lifter: Optional[bool]
    method_access_catwalk: Optional[bool]
    fixed_ladder_other_person_at_foot: Optional[str]
    fixed_ladder_adjustable_lanyard: Optional[str]

    # --- Isolation Section ---
    electrical_isolation_obtained: Optional[str]
    isolation_from: Optional[str]
    isolation_to: Optional[str]
    other_block_required: Optional[bool]
    other_block_describe: Optional[str]

    # --- Authorisation Section (from form) ---
    authorizer_name: Optional[str]
    # --- FIX: Use datetime.date ---
    authorizer_signature_date: Optional[datetime.date]
    
    # --- Timestamps & System Signatures ---
    # --- FIX: Use datetime.datetime ---
    created_at: datetime.datetime
    
    # 1. Permittee (Initiator) - System Link
    permittee_id: UUID
    permittee: Optional[UserPublic] = None # Nested user info
    
    # 2. Authorizer (SSE-Office) - System Link
    authorizer_id: Optional[UUID] = None
    # --- FIX: Use datetime.datetime ---
    authorized_at: Optional[datetime.datetime] = None
    authorizer: Optional[UserPublic] = None
    
    # 3. Approver (Safety Officer) - System Link
    approver_id: Optional[UUID] = None
    # --- FIX: Use datetime.datetime ---
    approved_at: Optional[datetime.datetime] = None
    approver_remarks: Optional[str] = None
    approver: Optional[UserPublic] = None
    
    # --- NEW: Nested Lists for Related Data ---
    ppes: List[PermitPPERead] = []
    attendees: List[PermitAttendeeRead] = []

    model_config = { "from_attributes": True }


# --- Update Schemas for Actions ---
class PermitApprove(BaseModel):
    approver_remarks: str = Field(..., max_length=500, examples=["Ensure all safety gear is worn."])