# FILE: server/app/modules/permit/permit_service.py
"""
Service Layer for the Permit Management Module.
Contains all business logic for permit operations, including creation, approval,
activation, closure, and extension handling.

PHASE 2 UPDATE:
- Integrates with Machine Service for LOTO (Lock Out / Tag Out).
- Automated Criticality Checks based on Maintenance Plans.
"""
from sqlmodel import Session, select
from uuid import UUID
from typing import List
import datetime
from datetime import timezone
from fastapi import HTTPException, status

# Models
from app.models import User, Permit, PermitPPE, PermitAttendee
from app.modules.machine.machine_models import MaintenanceTask

# Repositories and Schemas
from app.modules.permit import permit_repo, permit_schemas

# --- PHASE 2 INTEGRATION: Machine Service ---
from app.modules.machine import machine_service


# --- Helper to determine permit type from user role ---
def _get_permit_type_for_user(user: User) -> str:
    """
    Determines the permit type ("Height" or "Electrical") based on
    the user's role name.
    """
    if user.role.name == "SSE-Maintenance - MW":
        return "Height"
    elif user.role.name == "SSE-Maintenance - Substation":
        return "Electrical"
    
    # If the user is not a maintenance subclass, they cannot create a permit
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"User role '{user.role.name}' is not authorized to create permits."
    )

def create_permit(db: Session, permit_data: permit_schemas.PermitCreate, permittee: User) -> Permit:
    """
    Creates a new permit, associated PPEs, and attendees.
    
    PHASE 2 LOGIC:
    1. Links the Permit to a specific Machine and Maintenance Plan (if provided).
    2. Automatically flags the permit as 'is_critical' if the selected 
       Maintenance Plan contains any critical tasks.
    """
    # 1. Determine permit type from the user's role.
    permit_type = _get_permit_type_for_user(permittee)

    # 2. Criticality Logic (Phase 2)
    # If a maintenance plan is selected, check if it contains any "Critical" tasks.
    is_critical = False
    if permit_data.maintenance_plan_id:
        statement = select(MaintenanceTask).where(
            MaintenanceTask.plan_id == permit_data.maintenance_plan_id,
            MaintenanceTask.is_critical == True
        )
        # If even one critical task exists, the whole permit is Critical.
        if db.execute(statement).first():
            is_critical = True

    # 3. Create the main Permit object from the flat fields of the request data.
    # We explicitly map Phase 2 fields here.
    new_permit = Permit.model_validate(
        permit_data.model_dump(exclude={"ppes", "attendees"}),
        update={
            "permit_type": permit_type,
            "permittee_id": permittee.id,
            "status": "Pending Authorization",
            # Phase 2 Fields
            "machine_id": permit_data.machine_id,
            "maintenance_plan_id": permit_data.maintenance_plan_id,
            "is_critical": is_critical
        }
    )

    # 4. Instantiate the child SQLModel objects
    new_permit.ppes = [PermitPPE(**p.model_dump()) for p in permit_data.ppes]
    new_permit.attendees = [PermitAttendee(**a.model_dump()) for a in permit_data.attendees]

    # 5. Save via Repository
    try:
        return permit_repo.create_permit(db=db, permit=new_permit)
    except Exception as e:
        # Rollback in case of a database error
        db.rollback()
        print(f"Error creating permit in repo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create permit in database: {str(e)}"
        )

def get_permit_by_id(db: Session, permit_id: UUID) -> Permit:
    """
    Fetches a single permit by its ID.
    Raises 404 if not found.
    """
    permit = permit_repo.get_permit_by_id(db=db, permit_id=permit_id)
    if not permit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permit with ID {permit_id} not found."
        )
    return permit

def get_permits_for_user(db: Session, user: User) -> List[Permit]:
    """
    Fetches a list of permits relevant to the current user's role.
    """
    role_name = user.role.name
    # print(f"Fetching permits for user {user.email} with role {role_name}")

    if role_name.startswith("SSE-Maintenance"):
        # Permittee: Sees all permits they initiated
        return permit_repo.get_permits_by_permittee_id(db=db, user_id=user.id)
    
    elif role_name == "SSE-Office":
        # Authorizer: Sees permits awaiting their authorization
        # and permits awaiting extension approval
        pending_permits = permit_repo.get_permits_by_status(db=db, status="Pending Authorization")
        
        # Also include permits that are active and requesting extension
        extended_permits = permit_repo.get_permits_by_status(db=db, status="Active")
        extended_permits = [p for p in extended_permits if p.extension_requested]
        
        return pending_permits + extended_permits
    
    elif role_name == "Safety Officer":
        # Approver: Sees permits awaiting their final approval
        return permit_repo.get_permits_by_status(db=db, status="Pending Approval")
    
    return []

def authorize_permit(db: Session, permit_id: UUID, authorizer: User) -> Permit:
    """
    Authorizes a permit (SSE-Office action).
    Moves status from 'Pending Authorization' to 'Pending Approval'.
    """
    if authorizer.role.name != "SSE-Office":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only 'SSE-Office' users can authorize permits."
        )
    
    permit = get_permit_by_id(db=db, permit_id=permit_id) 
    
    if permit.status != "Pending Authorization":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permit must be 'Pending Authorization'. Current status: {permit.status}"
        )
    
    permit.status = "Pending Approval"
    permit.authorizer_id = authorizer.id
    permit.authorized_at = datetime.datetime.now(timezone.utc)
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    return updated_permit

def approve_permit(db: Session, permit_id: UUID, permit_data: permit_schemas.PermitApprove, approver: User) -> Permit:
    """
    Approves a permit (Safety Officer action).
    Moves status from 'Pending Approval' to 'Approved'.
    """
    if approver.role.name != "Safety Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only 'Safety Officer' users can approve permits."
        )
    
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    
    if permit.status != "Pending Approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permit must be 'Pending Approval'. Current status: {permit.status}"
        )
    
    permit.status = "Approved"
    permit.approver_id = approver.id
    permit.approved_at = datetime.datetime.now(timezone.utc)
    permit.approver_remarks = permit_data.approver_remarks
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    return updated_permit

# --- ACTIONS & EXTENSIONS (PHASE 2 UPDATED) ---

def activate_permit(db: Session, permit_id: UUID, user: User) -> Permit:
    """
    Activates a permit (Permittee action).
    
    PHASE 2 LOGIC (LOTO TRIGGER):
    1. Sets permit status to 'Active'.
    2. If permit is linked to a Machine, calls machine_service to LOCK it
       (Status -> UNDER_MAINTENANCE).
    """
    permit = get_permit_by_id(db=db, permit_id=permit_id)

    # 1. Check permissions: Only the original permittee can activate.
    if permit.permittee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user who initiated the permit can activate it."
        )
    
    # 2. Check status: Must be 'Approved'.
    if permit.status != "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permit must be 'Approved' to be activated. Current status: {permit.status}"
        )
        
    # 3. Check for extension request
    if permit.extension_requested:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot activate a permit that has a pending extension request."
        )

    # 4. Update permit: Set status and record the start time.
    permit.status = "Active"
    permit.actual_start_time = datetime.datetime.now(timezone.utc)
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    
    # --- LOTO ENFORCEMENT ---
    if updated_permit.machine_id:
        machine_service.lock_machine_status(db, updated_permit.machine_id)
    
    return updated_permit

def close_permit(db: Session, permit_id: UUID, user: User) -> Permit:
    """
    Closes a permit (Permittee action).
    
    PHASE 2 LOGIC (LOTO RELEASE):
    1. Sets permit status to 'Closed'.
    2. If permit is linked to a Machine, calls machine_service to UNLOCK it
       (Status -> OPERATIONAL).
    """
    permit = get_permit_by_id(db=db, permit_id=permit_id)

    # 1. Check permissions: Only the original permittee can close.
    if permit.permittee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user who initiated the permit can close it."
        )

    # 2. Check status: Must be 'Active'.
    if permit.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permit must be 'Active' to be closed. Current status: {permit.status}"
        )
        
    # 3. Check for pending extension request
    if permit.extension_requested:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot close a permit that has a pending extension request."
        )

    # 4. Update permit: Set status and record the end time.
    permit.status = "Closed"
    permit.actual_end_time = datetime.datetime.now(timezone.utc)
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    
    # --- LOTO RELEASE ---
    if updated_permit.machine_id:
        machine_service.unlock_machine_status(db, updated_permit.machine_id)

    return updated_permit

def request_permit_extension(db: Session, permit_id: UUID, extension_data: permit_schemas.PermitExtensionRequest, user: User) -> Permit:
    """
    Requests an extension for an 'Active' permit (Permittee action).
    Sets the extension flags and requested new end time.
    """
    permit = get_permit_by_id(db=db, permit_id=permit_id)

    # 1. Check permissions
    if permit.permittee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user who initiated the permit can request an extension."
        )

    # 2. Check status
    if permit.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permit must be 'Active' to request an extension. Current status: {permit.status}"
        )
        
    # 3. Check if already requested
    if permit.extension_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An extension has already been requested for this permit."
        )
        
    # 4. Check new end time logic
    try:
        if permit.finish_date and permit.finish_time:
            current_finish_datetime = datetime.datetime.combine(permit.finish_date, permit.finish_time, tzinfo=timezone.utc)
            if extension_data.requested_new_end_time.astimezone(timezone.utc) <= current_finish_datetime:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Requested new end time must be later than the current permit finish date/time."
                )
    except Exception:
        pass 

    # 5. Update permit
    permit.extension_requested = True
    permit.extension_reason = extension_data.extension_reason
    permit.requested_new_end_time = extension_data.requested_new_end_time
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    return updated_permit

def approve_permit_extension(db: Session, permit_id: UUID, authorizer: User) -> Permit:
    """
    Approves an extension request (SSE-Office action).
    Updates the permit's finish time and clears the extension flags.
    """
    permit = get_permit_by_id(db=db, permit_id=permit_id)

    # 1. Check permissions
    if authorizer.role.name != "SSE-Office":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only 'SSE-Office' users can approve permit extensions."
        )

    # 2. Check status
    if permit.status != "Active" or not permit.extension_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permit must be 'Active' and have a pending extension request to be approved."
        )
        
    if not permit.requested_new_end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve extension: requested new end time is missing."
        )

    # 3. Update permit dates
    permit.finish_date = permit.requested_new_end_time.date()
    permit.finish_time = permit.requested_new_end_time.time()
    
    # Clear extension flags
    permit.extension_requested = False
    permit.extension_reason = None
    permit.requested_new_end_time = None
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    return updated_permit