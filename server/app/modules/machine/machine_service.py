from sqlmodel import Session, select
from typing import List
from fastapi import HTTPException, status
from app.modules.machine.machine_models import Machine, MaintenancePlan, MaintenanceTask
from uuid import UUID
from sqlalchemy.orm import selectinload

# Import for Passport Aggregation
from app.models import Permit
from app.modules.incident.models import Incident

def get_all_machines(db: Session):
    statement = select(Machine).options(selectinload(Machine.shop))
    results = db.execute(statement).scalars().all()
    
    machines_data =[]
    for m in results:
        machine_dict = m.model_dump()
        machine_dict["shop_name"] = m.shop.name if m.shop else None
        
        # Populate dummy data for new fields if empty for a richer UI experience
        if not machine_dict.get("workspace_zone"): machine_dict["workspace_zone"] = "General Zone"
        if not machine_dict.get("weight_capacity"): machine_dict["weight_capacity"] = "5 Tons"
        if not machine_dict.get("power_source"): machine_dict["power_source"] = "415V 3-Phase AC"
        if not machine_dict.get("competency_required"): machine_dict["competency_required"] = "SKILLED"
        
        machines_data.append(machine_dict)

    return machines_data

def get_machine_by_asset_id(db: Session, asset_id: str) -> Machine | None:
    statement = select(Machine).where(Machine.asset_id == asset_id)
    return db.execute(statement).scalar_one_or_none()

def get_machine_checklist(db: Session, machine_id: UUID) -> List[MaintenanceTask]:
    machine = db.get(Machine, machine_id)
    if not machine: raise HTTPException(status_code=404, detail="Machine not found")
    statement = select(MaintenancePlan).where(MaintenancePlan.machine_type_id == machine.type_id)
    plan = db.execute(statement).scalars().first()
    if not plan: return[]
    task_statement = select(MaintenanceTask).where(MaintenanceTask.plan_id == plan.id)
    return db.execute(task_statement).scalars().all()

def lock_machine_status(db: Session, machine_id: UUID, commit: bool = True):
    machine = db.get(Machine, machine_id)
    if machine:
        machine.status = "UNDER_MAINTENANCE"
        db.add(machine)
        if commit:
            db.commit()
            db.refresh(machine)

def unlock_machine_status(db: Session, machine_id: UUID):
    machine = db.get(Machine, machine_id)
    if machine:
        machine.status = "OPERATIONAL"
        db.add(machine)
        db.commit()
        db.refresh(machine)

# --- NEW: Machine Passport Aggregation Logic ---
def get_machine_passport(db: Session, machine_id: UUID):
    """Aggregates all history, permits, and incidents into a single Passport."""
    statement = select(Machine).options(selectinload(Machine.shop)).where(Machine.id == machine_id)
    machine = db.execute(statement).scalar_one_or_none()
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    machine_dict = machine.model_dump()
    machine_dict["shop_name"] = machine.shop.name if machine.shop else None
    if not machine_dict.get("workspace_zone"): machine_dict["workspace_zone"] = "General Zone"
    if not machine_dict.get("weight_capacity"): machine_dict["weight_capacity"] = "5 Tons"
    if not machine_dict.get("power_source"): machine_dict["power_source"] = "415V 3-Phase AC"
    if not machine_dict.get("competency_required"): machine_dict["competency_required"] = "SKILLED"

    # Fetch Permits
    permits = db.execute(
        select(Permit).options(selectinload(Permit.permittee)).where(Permit.machine_id == machine_id)
    ).scalars().all()
    
    # Fetch Incidents
    incidents = db.execute(
        select(Incident).options(selectinload(Incident.reported_by)).where(Incident.machine_id == machine_id)
    ).scalars().all()

    timeline = []
    active_permits_data =[]

    for p in permits:
        is_active = p.status in ["Active", "Approved", "Pending Closure"]
        permit_data = {
            "id": str(p.id),
            "permit_no": p.permit_no or str(p.id)[:8],
            "type": p.permit_type,
            "status": p.status,
            "description": p.work_description,
            "permittee": p.permittee.full_name if p.permittee else "Unknown"
        }
        if is_active: active_permits_data.append(permit_data)
        
        timeline.append({
            "event_date": p.created_at,
            "event_type": "PERMIT",
            "title": f"Permit {p.permit_no or str(p.id)[:8]} Issued",
            "description": p.work_description,
            "status": p.status,
            "actor_name": permit_data["permittee"]
        })

    recent_incidents_data =[]
    for i in incidents:
        inc_data = {
            "id": str(i.id),
            "code": i.incident_code,
            "title": i.title,
            "severity": i.severity.value,
            "status": i.status.value
        }
        recent_incidents_data.append(inc_data)
        
        timeline.append({
            "event_date": i.occurred_at,
            "event_type": "INCIDENT",
            "title": f"Incident {i.incident_code} Reported",
            "description": i.title,
            "severity": i.severity.value,
            "status": i.status.value,
            "actor_name": i.reported_by.full_name if i.reported_by else "Unknown"
        })

    # Sort timeline chronologically (newest first)
    timeline.sort(key=lambda x: x["event_date"], reverse=True)

    return {
        "machine": machine_dict,
        "active_permits": active_permits_data,
        "recent_incidents": recent_incidents_data,
        "health_timeline": timeline
    }