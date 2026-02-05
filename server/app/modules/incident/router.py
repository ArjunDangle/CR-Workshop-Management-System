from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.modules.incident.service import IncidentService
from app.modules.incident.models import (
    Incident, CAPA, IncidentSeverity, IncidentStatus, CAPAStatus, CAPAType,
    IncidentCategory
)

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents"])

# Incident Endpoints

@router.post("/", response_model=Incident)
async def create_incident(
    incident_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new incident"""
    try:
        service = IncidentService(db)
        return service.create_incident(incident_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=List[Incident])
async def get_all_incidents(db: Session = Depends(get_db)):
    """Get all incidents"""
    try:
        service = IncidentService(db)
        return service.get_all_incidents()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{incident_id}", response_model=Incident)
async def get_incident_by_id(
    incident_id: UUID,
    db: Session = Depends(get_db)
):
    """Get incident by ID"""
    try:
        service = IncidentService(db)
        incident = service.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        return incident
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/severity/{severity}", response_model=List[Incident])
async def get_incidents_by_severity(
    severity: IncidentSeverity,
    db: Session = Depends(get_db)
):
    """Get incidents by severity"""
    try:
        service = IncidentService(db)
        return service.get_incidents_by_severity(severity)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/status/{status}", response_model=List[Incident])
async def get_incidents_by_status(
    status: IncidentStatus,
    db: Session = Depends(get_db)
):
    """Get incidents by status"""
    try:
        service = IncidentService(db)
        return service.get_incidents_by_status(status)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/{incident_id}/status")
async def update_incident_status(
    incident_id: UUID,
    new_status: IncidentStatus,
    db: Session = Depends(get_db)
):
    """Update incident status"""
    try:
        service = IncidentService(db)
        incident = service.update_incident_status(incident_id, new_status)
        return {"message": "Incident status updated successfully", "incident": incident}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# CAPA Endpoints

@router.post("/{incident_id}/capas", response_model=CAPA)
async def create_capa(
    incident_id: UUID,
    capa_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new CAPA for an incident"""
    try:
        capa_data["incident_id"] = incident_id
        service = IncidentService(db)
        return service.create_capa(capa_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{incident_id}/capas", response_model=List[CAPA])
async def get_capas_by_incident_id(
    incident_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all CAPAs for an incident"""
    try:
        service = IncidentService(db)
        # Verify incident exists
        incident = service.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return service.get_capas_by_incident_id(incident_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/capas/{capa_id}", response_model=CAPA)
async def get_capa_by_id(
    capa_id: UUID,
    db: Session = Depends(get_db)
):
    """Get CAPA by ID"""
    try:
        service = IncidentService(db)
        capa = service.get_capa_by_id(capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        return capa
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/capas/status/{status}", response_model=List[CAPA])
async def get_capas_by_status(
    status: CAPAStatus,
    db: Session = Depends(get_db)
):
    """Get CAPAs by status"""
    try:
        service = IncidentService(db)
        return service.get_capas_by_status(status)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/capas/{capa_id}/status")
async def update_capa_status(
    capa_id: UUID,
    new_status: CAPAStatus,
    db: Session = Depends(get_db)
):
    """Update CAPA status"""
    try:
        service = IncidentService(db)
        capa = service.update_capa_status(capa_id, new_status)
        return {"message": "CAPA status updated successfully", "capa": capa}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/capas/overdue", response_model=List[CAPA])
async def get_overdue_capas(db: Session = Depends(get_db)):
    """Get all overdue CAPAs"""
    try:
        service = IncidentService(db)
        return service.get_overdue_capas()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Statistics Endpoints

@router.get("/stats/dashboard")
async def get_incident_statistics(db: Session = Depends(get_db)):
    """Get incident statistics for dashboard"""
    try:
        service = IncidentService(db)
        return service.get_incident_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Kill Switch Endpoint

@router.post("/kill-switch/trigger/{incident_id}")
async def trigger_kill_switch(
    incident_id: UUID,
    db: Session = Depends(get_db)
):
    """Manually trigger kill switch for an incident (Emergency use only)"""
    try:
        service = IncidentService(db)
        incident = service.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        if incident.severity not in [IncidentSeverity.MAJOR, IncidentSeverity.FATAL]:
            raise HTTPException(
                status_code=400, 
                detail="Kill switch can only be triggered for MAJOR or FATAL incidents"
            )
        
        service._enforce_kill_switch(incident)
        return {
            "message": "Kill switch triggered successfully",
            "incident_id": str(incident_id),
            "severity": incident.severity,
            "timestamp": str(incident.updated_at)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")