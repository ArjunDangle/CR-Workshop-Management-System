# FILE: server/app/modules/machine/machine_router.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from uuid import UUID  # <-- IMPORT UUID FOR PATH PARAMETER

from app.core.database import get_db
from app.modules.auth.auth_dependencies import get_current_active_user
from app.modules.machine import machine_service, machine_schemas

router = APIRouter(
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=List[machine_schemas.MachineRead])
def list_machines(db: Session = Depends(get_db)):
    """List all machines in the workshop."""
    return machine_service.get_all_machines(db)

# --- NEW ENDPOINT FOR PHASE 4 ---
@router.get(
    "/{machine_id}/checklist", 
    response_model=List[machine_schemas.MaintenanceTaskRead],
    summary="Get Machine SOP Checklist"
)
def get_machine_sop_checklist(
    machine_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Fetches the Standard Operating Procedure (SOP) checklist for a specific machine.
    
    This endpoint is used by the frontend to dynamically populate the safety tasks
    on the "Create Permit" form after a machine is selected.
    """
    return machine_service.get_machine_checklist(db=db, machine_id=machine_id)
# --- END NEW ENDPOINT ---