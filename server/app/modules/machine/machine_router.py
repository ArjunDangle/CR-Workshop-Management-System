from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

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