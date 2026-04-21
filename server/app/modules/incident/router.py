# FILE: server/app/modules/incident/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models import User
from app.modules.auth.auth_dependencies import get_current_active_user
from app.modules.incident.service import IncidentService
from .models import IncidentStatus, CAPAStatus
from .schemas import (
    IncidentCreate,
    IncidentRead,
    CAPACreate,
    CAPARead,
    IncidentStats,
    IncidentWitnessCreate,
    IncidentWitnessRead,
    IncidentReviewUpdate
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident_endpoint(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = IncidentService(db)
    incident_data.reported_by_id = current_user.id
    return service.create_incident(incident_data)

@router.get("/", response_model=List[IncidentRead])
def get_all_incidents_endpoint(db: Session = Depends(get_db)):
    service = IncidentService(db)
    return service.get_all_incidents()

@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident_by_id_endpoint(incident_id: UUID, db: Session = Depends(get_db)):
    service = IncidentService(db)
    incident = service.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{incident_id}/status", response_model=IncidentRead)
def update_incident_status_endpoint(
    incident_id: UUID,
    status_update: dict,
    db: Session = Depends(get_db)
):
    service = IncidentService(db)
    new_status = status_update.get("status")
    if not new_status or not hasattr(IncidentStatus, new_status):
        raise HTTPException(status_code=400, detail="Invalid status provided")
    return service.update_incident_status(incident_id, IncidentStatus(new_status))

# --- NEW: Fault-to-Fix Link Endpoint ---
@router.post("/{incident_id}/link-resolution-permit", response_model=IncidentRead)
def link_resolution_permit_endpoint(
    incident_id: UUID,
    payload: dict, # {"permit_id": "uuid..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    permit_id = payload.get("permit_id")
    if not permit_id:
        raise HTTPException(status_code=400, detail="permit_id is required")
    service = IncidentService(db)
    return service.link_resolution_permit(incident_id, UUID(permit_id))

# --- NEW: Chain of Custody Review Endpoint ---
@router.post("/{incident_id}/review", response_model=IncidentRead)
def review_incident_endpoint(
    incident_id: UUID,
    review_data: IncidentReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Enforce Auth: Only Safety Officer or SSE-Office can review
    if current_user.role.name not in["Safety Officer", "SSE-Office", "CWM"]:
         raise HTTPException(status_code=403, detail="Unauthorized to review incidents")
         
    service = IncidentService(db)
    return service.review_incident(incident_id, current_user.id, review_data)

# --- NEW: Add Witness Endpoint ---
@router.post("/{incident_id}/witnesses", response_model=IncidentWitnessRead, status_code=status.HTTP_201_CREATED)
def add_incident_witness_endpoint(
    incident_id: UUID,
    witness_data: IncidentWitnessCreate,
    db: Session = Depends(get_db)
):
    service = IncidentService(db)
    return service.add_witness(incident_id, witness_data)

@router.post("/{incident_id}/capas", response_model=CAPARead)
def create_capa_endpoint(
    incident_id: UUID,
    capa_data: CAPACreate,
    db: Session = Depends(get_db)
):
    service = IncidentService(db)
    return service.create_capa(incident_id, capa_data)

@router.get("/{incident_id}/capas", response_model=List[CAPARead])
def get_capas_for_incident_endpoint(incident_id: UUID, db: Session = Depends(get_db)):
    service = IncidentService(db)
    return service.get_capas_by_incident_id(incident_id)

@router.patch("/capas/{capa_id}/status", response_model=CAPARead)
def update_capa_status_endpoint(
    capa_id: UUID,
    status_update: dict,
    db: Session = Depends(get_db)
):
    service = IncidentService(db)
    new_status = status_update.get("status")
    if not new_status or not hasattr(CAPAStatus, new_status):
        raise HTTPException(status_code=400, detail="Invalid status provided")
    return service.update_capa_status(capa_id, CAPAStatus(new_status))

@router.get("/stats/dashboard", response_model=IncidentStats)
def get_dashboard_stats_endpoint(db: Session = Depends(get_db)):
    service = IncidentService(db)
    return service.get_incident_statistics()