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
    IncidentStats
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident_endpoint(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = IncidentService(db)
    # Automatically set the reporter to the logged-in user
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
    status_update: dict, # Expects {"status": "CLOSED"}
    db: Session = Depends(get_db)
):
    service = IncidentService(db)
    new_status = status_update.get("status")
    if not new_status or not hasattr(IncidentStatus, new_status):
        raise HTTPException(status_code=400, detail="Invalid status provided")
    return service.update_incident_status(incident_id, IncidentStatus(new_status))

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
    status_update: dict, # Expects {"status": "COMPLETED"}
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