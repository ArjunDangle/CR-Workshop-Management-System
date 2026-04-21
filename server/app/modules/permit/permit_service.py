# FILE: server/app/modules/permit/permit_service.py
from sqlmodel import Session, select
from uuid import UUID
from typing import List
import datetime
from datetime import timezone
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

from app.models import User, Permit, PermitPPE, PermitAttendee, PermitWorkerLink
from app.modules.machine.machine_models import MaintenanceTask
from app.modules.permit import permit_repo, permit_schemas
from app.modules.machine import machine_service
from app.modules.contractor.service import contractor_service

def _get_permit_type_for_user(user: User) -> str:
    if user.role.name == "SSE-Maintenance - MW":
        return "Height"
    elif user.role.name == "SSE-Maintenance - Substation":
        return "Electrical"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"User role '{user.role.name}' is not authorized to create permits.")

def check_permit_conflicts(db: Session, permit_id: UUID) -> permit_schemas.PermitConflictReport:
    """Pre-Activation SIMOPS Conflict Check"""
    permit = get_permit_by_id(db, permit_id)
    
    active_permits = db.execute(
        select(Permit).where(
            Permit.status.in_(["Active", "Approved", "Pending Closure"]),
            Permit.id != permit_id
        )
    ).scalars().all()
    
    conflicts =[]
    current_worker_links = db.execute(select(PermitWorkerLink).where(PermitWorkerLink.permit_id == permit_id)).scalars().all()
    current_worker_ids =[link.worker_id for link in current_worker_links]
    
    for p in active_permits:
        # 1. Machine Conflict
        if permit.machine_id and p.machine_id == permit.machine_id:
            conflicts.append(permit_schemas.PermitConflictItem(
                permit_id=p.id, permit_no=p.permit_no or str(p.id)[:8],
                conflict_type="MACHINE", description=f"Shared Machine/Asset: {p.machine.asset_id if p.machine else 'Unknown'}"
            ))
            
        # 2. Location / Zone Conflict
        if permit.work_location and p.work_location == permit.work_location:
            conflicts.append(permit_schemas.PermitConflictItem(
                permit_id=p.id, permit_no=p.permit_no or str(p.id)[:8],
                conflict_type="LOCATION", description=f"Overlapping Zone: {p.work_location}"
            ))
            
        # 3. Workforce Overlap Check
        if current_worker_ids:
            overlapping_workers = db.execute(
                select(PermitWorkerLink).where(
                    PermitWorkerLink.permit_id == p.id,
                    PermitWorkerLink.worker_id.in_(current_worker_ids)
                )
            ).scalars().all()
            
            for ow in overlapping_workers:
                worker_name = ow.worker.full_name if ow.worker else str(ow.worker_id)
                conflicts.append(permit_schemas.PermitConflictItem(
                    permit_id=p.id, permit_no=p.permit_no or str(p.id)[:8],
                    conflict_type="WORKER", description=f"Fatigue/Shared Worker Risk: {worker_name}"
                ))
                
    return permit_schemas.PermitConflictReport(has_conflicts=len(conflicts) > 0, conflicts=conflicts)

def create_permit(db: Session, permit_data: permit_schemas.PermitCreate, permittee: User) -> Permit:
    permit_type = _get_permit_type_for_user(permittee)

    if permit_data.contractor_id:
        contractor_service.validate_contractor_for_permit(db, permit_data.contractor_id)
    
    for worker_id in permit_data.worker_ids:
        contractor_service.validate_worker_for_permit(db, worker_id)
    
    is_critical = False
    if permit_data.maintenance_plan_id:
        statement = select(MaintenanceTask).where(MaintenanceTask.plan_id == permit_data.maintenance_plan_id, MaintenanceTask.is_critical == True)
        if db.execute(statement).first():
            is_critical = True

    new_permit = Permit.model_validate(
        permit_data.model_dump(exclude={"ppes", "attendees", "worker_ids"}),
        update={
            "permit_type": permit_type,
            "permittee_id": permittee.id,
            "status": "Pending Authorization",
            "machine_id": permit_data.machine_id,
            "maintenance_plan_id": permit_data.maintenance_plan_id,
            "is_critical": is_critical,
            "contractor_id": permit_data.contractor_id
        }
    )

    new_permit.ppes =[PermitPPE(**p.model_dump()) for p in permit_data.ppes]
    new_permit.attendees =[PermitAttendee(**a.model_dump()) for a in permit_data.attendees]

    try:
        saved_permit = permit_repo.create_permit(db=db, permit=new_permit)
        for worker_id in permit_data.worker_ids:
            worker_link = PermitWorkerLink(permit_id=saved_permit.id, worker_id=worker_id, role="Assigned Worker")
            db.add(worker_link)
        db.commit()
        return saved_permit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def get_permit_by_id(db: Session, permit_id: UUID) -> Permit:
    permit = permit_repo.get_permit_by_id(db=db, permit_id=permit_id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found.")
    
    # Eager load inspector if available
    if permit.inspector_id and not permit.inspector:
        permit.inspector = db.get(User, permit.inspector_id)
    return permit

def get_permits_for_user(db: Session, user: User) -> List[Permit]:
    role_name = user.role.name
    
    # 1. Maintenance Workers only see their own permits
    if role_name.startswith("SSE-Maintenance"):
        return permit_repo.get_permits_by_permittee_id(db=db, user_id=user.id)
    
    # 2. Safety Officers & SSE-Office are administrators. 
    # They receive the full list so the frontend dashboard can filter them into Active/Pending/History.
    elif role_name in["SSE-Office", "Safety Officer"]:
        return permit_repo.get_all_permits(db=db)
    
    return

def authorize_permit(db: Session, permit_id: UUID, authorizer: User) -> Permit:
    if authorizer.role.name != "SSE-Office":
        raise HTTPException(status_code=403, detail="Only 'SSE-Office' users can authorize permits.")
    
    permit = get_permit_by_id(db=db, permit_id=permit_id) 
    if permit.status != "Pending Authorization":
        raise HTTPException(status_code=400, detail="Invalid status")
    
    permit.status = "Pending Approval"
    permit.authorizer_id = authorizer.id
    permit.authorized_at = datetime.datetime.now(timezone.utc)
    return permit_repo.update_permit(db=db, permit=permit)

def approve_permit(db: Session, permit_id: UUID, permit_data: permit_schemas.PermitApprove, approver: User) -> Permit:
    if approver.role.name != "Safety Officer":
        raise HTTPException(status_code=403, detail="Only 'Safety Officer' users can approve permits.")
    
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if permit.status != "Pending Approval":
        raise HTTPException(status_code=400, detail="Invalid status")
    
    conflict_report = check_permit_conflicts(db, permit_id)
    if conflict_report.has_conflicts and not permit_data.simops_acknowledged:
        raise HTTPException(status_code=400, detail="SIMOPS conflicts detected. Acknowledge them to approve.")
    
    permit.status = "Approved"
    permit.approver_id = approver.id
    permit.approved_at = datetime.datetime.now(timezone.utc)
    permit.approver_remarks = permit_data.approver_remarks
    permit.simops_acknowledged = permit_data.simops_acknowledged
    return permit_repo.update_permit(db=db, permit=permit)

def activate_permit(db: Session, permit_id: UUID, user: User) -> Permit:
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if permit.permittee_id != user.id: raise HTTPException(status_code=403, detail="Unauthorized")
    if permit.status != "Approved": raise HTTPException(status_code=400, detail="Invalid status")
    if permit.extension_requested: raise HTTPException(status_code=400, detail="Pending extension")

    permit.status = "Active"
    permit.actual_start_time = datetime.datetime.now(timezone.utc)
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    
    if updated_permit.machine_id:
        machine_service.lock_machine_status(db, updated_permit.machine_id)
    return updated_permit

def submit_handback(db: Session, permit_id: UUID, handback_data: permit_schemas.PermitHandback, user: User) -> Permit:
    """Phase 1 of Closure: Permit holder submits declaration."""
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if permit.permittee_id != user.id: raise HTTPException(status_code=403, detail="Unauthorized")
    if permit.status != "Active": raise HTTPException(status_code=400, detail="Permit must be Active")
    if permit.extension_requested: raise HTTPException(status_code=400, detail="Pending extension")

    permit.status = "Pending Closure"
    permit.actual_end_time = datetime.datetime.now(timezone.utc)
    permit.handback_declaration = handback_data.handback_declaration
    permit.handback_time = datetime.datetime.now(timezone.utc)
    return permit_repo.update_permit(db=db, permit=permit)

def verify_closure(db: Session, permit_id: UUID, verify_data: permit_schemas.PermitVerifyClosure, user: User) -> Permit:
    """Phase 2 of Closure: Safety Officer inspects and releases LOTO."""
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if user.role.name != "Safety Officer": raise HTTPException(status_code=403, detail="Unauthorized")
    if permit.status != "Pending Closure": raise HTTPException(status_code=400, detail="Must be Pending Closure")

    permit.status = "Closed"
    permit.inspection_remarks = verify_data.inspection_remarks
    permit.inspector_id = user.id
    permit.inspection_time = datetime.datetime.now(timezone.utc)
    
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    if updated_permit.machine_id:
        machine_service.unlock_machine_status(db, updated_permit.machine_id)
    return updated_permit

def request_permit_extension(db: Session, permit_id: UUID, extension_data: permit_schemas.PermitExtensionRequest, user: User) -> Permit:
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if permit.permittee_id != user.id: raise HTTPException(status_code=403, detail="Unauthorized")
    if permit.status != "Active": raise HTTPException(status_code=400, detail="Invalid status")
    if permit.extension_requested: raise HTTPException(status_code=400, detail="Already requested")
        
    try:
        if permit.finish_date and permit.finish_time:
            current_finish_datetime = datetime.datetime.combine(permit.finish_date, permit.finish_time, tzinfo=timezone.utc)
            if extension_data.requested_new_end_time.astimezone(timezone.utc) <= current_finish_datetime:
                 raise HTTPException(status_code=400, detail="Requested new end time must be later.")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"CRITICAL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error")

    permit.extension_requested = True
    permit.extension_reason = extension_data.extension_reason
    permit.requested_new_end_time = extension_data.requested_new_end_time
    return permit_repo.update_permit(db=db, permit=permit)

def approve_permit_extension(db: Session, permit_id: UUID, authorizer: User) -> Permit:
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if authorizer.role.name != "SSE-Office": raise HTTPException(status_code=403, detail="Unauthorized")
    if permit.status != "Active" or not permit.extension_requested: raise HTTPException(status_code=400, detail="Invalid status")
        
    permit.finish_date = permit.requested_new_end_time.date()
    permit.finish_time = permit.requested_new_end_time.time()
    permit.extension_requested = False
    permit.extension_reason = None
    permit.requested_new_end_time = None
    return permit_repo.update_permit(db=db, permit=permit)

# --- MODULE 5 INTEGRATION: Kill Switch Support ---
def suspend_permit(db: Session, permit_id: UUID, reason: str = "Severe Incident", commit: bool = False) -> Permit:
    permit = get_permit_by_id(db=db, permit_id=permit_id)
    if permit.status not in["Active", "Approved"]:
        raise HTTPException(status_code=400, detail=f"Cannot suspend status '{permit.status}'")
    permit.status = "Suspended"
    updated_permit = permit_repo.update_permit(db=db, permit=permit)
    if commit:
        db.commit()
        db.refresh(updated_permit)
    return updated_permit