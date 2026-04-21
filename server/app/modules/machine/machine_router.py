from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.modules.auth.auth_dependencies import get_current_active_user
from app.modules.machine import machine_service, machine_schemas

router = APIRouter(dependencies=[Depends(get_current_active_user)])

@router.get("/", response_model=List[machine_schemas.MachineRead])
def list_machines(db: Session = Depends(get_db)):
    return machine_service.get_all_machines(db)

@router.get("/{machine_id}/checklist", response_model=List[machine_schemas.MaintenanceTaskRead])
def get_machine_sop_checklist(machine_id: UUID, db: Session = Depends(get_db)):
    return machine_service.get_machine_checklist(db=db, machine_id=machine_id)

# --- NEW: Passport Endpoint ---
@router.get("/{machine_id}/passport", response_model=machine_schemas.MachinePassportRead)
def get_machine_passport(machine_id: UUID, db: Session = Depends(get_db)):
    """Fetches the complete Digital Passport for a machine (Timeline, Permits, Specs)."""
    return machine_service.get_machine_passport(db=db, machine_id=machine_id)