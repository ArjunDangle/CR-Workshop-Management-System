from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from app.modules.machine.machine_models import Machine, MaintenancePlan, MaintenanceTask
from uuid import UUID

from sqlalchemy.orm import selectinload

def get_all_machines(db: Session):
    """Retrieve all assets with their shop details attached."""
    # Use join to get shop names for grouping
    statement = select(Machine).options(selectinload(Machine.shop))
    results = db.execute(statement).scalars().all()
    
    # FIX: Convert model to dict to inject 'shop_name'
    # SQLModel instances are strict and don't allow setting new attributes dynamically
    machines_data = []
    for m in results:
        machine_dict = m.model_dump()
        # Manually fetch the relationship data since model_dump might exclude it
        machine_dict["shop_name"] = m.shop.name if m.shop else None
        machines_data.append(machine_dict)

    return machines_data

def get_machine_by_asset_id(db: Session, asset_id: str) -> Machine | None:
    statement = select(Machine).where(Machine.asset_id == asset_id)
    return db.execute(statement).scalar_one_or_none()

def get_machine_checklist(db: Session, machine_id: UUID) -> List[MaintenanceTask]:
    """
    Fetches the Standard Operating Procedure (SOP) checklist for a specific machine.
    Logic: Machine -> MachineType -> MaintenancePlan -> Tasks
    """
    machine = db.get(Machine, machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Fetch the default plan for this machine type (Simplified logic for Phase 2)
    # In a full system, you might select *which* plan (Weekly/Monthly)
    statement = select(MaintenancePlan).where(MaintenancePlan.machine_type_id == machine.type_id)
    plan = db.execute(statement).scalars().first()

    if not plan:
        return []

    # Fetch tasks linked to this plan
    task_statement = select(MaintenanceTask).where(MaintenanceTask.plan_id == plan.id)
    return db.execute(task_statement).scalars().all()

def lock_machine_status(db: Session, machine_id: UUID, commit: bool = True):
    """
    LOTO ENFORCEMENT: Hard-locks the machine status in the DB.
    Triggered when a Permit becomes ACTIVE or during Kill Switch.
    
    Args:
        db: Database session
        machine_id: UUID of the machine to lock
        commit: Whether to commit the transaction (default True for backward compatibility)
    """
    machine = db.get(Machine, machine_id)
    if machine:
        print(f"🔒 LOTO TRIGGER: Locking Machine {machine.asset_id} (Under Maintenance)")
        machine.status = "UNDER_MAINTENANCE"
        db.add(machine)
        if commit:
            db.commit()
            db.refresh(machine)

def unlock_machine_status(db: Session, machine_id: UUID):
    """
    LOTO RELEASE: Resets the machine status.
    Triggered when a Permit becomes CLOSED.
    """
    machine = db.get(Machine, machine_id)
    if machine:
        print(f"🔓 LOTO RELEASE: Unlocking Machine {machine.asset_id} (Operational)")
        machine.status = "OPERATIONAL"
        db.add(machine)
        db.commit()
        db.refresh(machine)