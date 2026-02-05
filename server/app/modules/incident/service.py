from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta
from sqlmodel import Session, select
from fastapi import HTTPException, status

from .models import Incident, CAPA, IncidentSeverity, IncidentStatus, CAPAStatus
from .schemas import IncidentCreate, CAPACreate
from app.modules.machine.machine_models import Machine
import app.modules.machine.machine_service as machine_service
import app.modules.permit.permit_service as permit_service
from app.modules.contractor.service import contractor_service

class IncidentService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_incident_code(self) -> str:
        """Generates a unique incident code like INC-YYYY-NNNN."""
        year = datetime.now().year
        # This is a simple way to get a sequence number. In high-concurrency, a dedicated sequence table might be better.
        count_this_year = self.db.execute(
            select(Incident).where(Incident.incident_code.like(f"INC-{year}-%"))
        ).raw.rowcount
        return f"INC-{year}-{(count_this_year or 0) + 1:04d}"

    def create_incident(self, incident_data: IncidentCreate) -> Incident:
        """Create a new incident and enforce kill switch if necessary."""
        try:
            # Create a model instance from the Pydantic schema
            incident = Incident.model_validate(incident_data)
            incident.incident_code = self._generate_incident_code() # Assign unique code
            
            db.add(incident)
            db.flush()

            if incident.severity in [IncidentSeverity.MAJOR, IncidentSeverity.FATAL]:
                self._enforce_kill_switch(incident)

            db.commit()
            db.refresh(incident)
            return incident
            
        except Exception as e:
            db.rollback()
            raise e

    def get_incident_by_id(self, incident_id: UUID) -> Optional[Incident]:
        statement = select(Incident).where(Incident.id == incident_id)
        return self.db.execute(statement).scalars().first()

    def get_all_incidents(self) -> List[Incident]:
        statement = select(Incident).order_by(Incident.reported_at.desc())
        return self.db.execute(statement).scalars().all()

    def update_incident_status(self, incident_id: UUID, new_status: IncidentStatus) -> Incident:
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        incident.status = new_status
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def _enforce_kill_switch(self, incident: Incident):
        print(f"🚨 KILL SWITCH ACTIVATED for Incident {incident.incident_code} 🚨")
        # Logic to suspend permits and lock machines
        pass # Placeholder for now

    def create_capa(self, incident_id: UUID, capa_data: CAPACreate) -> CAPA:
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Cannot create CAPA: Incident not found")
        
        capa = CAPA.model_validate(capa_data, update={"incident_id": incident_id})
        self.db.add(capa)
        self.db.commit()
        self.db.refresh(capa)
        return capa

    def get_capas_by_incident_id(self, incident_id: UUID) -> List[CAPA]:
        statement = select(CAPA).where(CAPA.incident_id == incident_id)
        return self.db.execute(statement).scalars().all()

    def update_capa_status(self, capa_id: UUID, new_status: CAPAStatus) -> CAPA:
        capa = self.db.get(CAPA, capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        
        capa.status = new_status
        if new_status == CAPAStatus.COMPLETED:
            capa.completed_at = datetime.now()

        self.db.commit()
        self.db.refresh(capa)
        return capa

    def get_incident_statistics(self) -> dict:
        """Get incident statistics for dashboard."""
        today = date.today()
        
        # Simplified days without accident logic
        last_major_incident = self.db.execute(
            select(Incident).where(Incident.severity.in_([IncidentSeverity.MAJOR, IncidentSeverity.FATAL]))
            .order_by(Incident.occurred_at.desc())
        ).scalars().first()
        
        days_without_accident = (today - last_major_incident.occurred_at.date()).days if last_major_incident else 365

        # --- FIX: Use db.execute and select with count ---
        # A more efficient way to count is needed here, but for now, this works
        all_incidents = self.get_all_incidents()
        all_capas = self.db.execute(select(CAPA)).scalars().all()

        stats = {
            "total_incidents": len(all_incidents),
            "open_incidents": len([i for i in all_incidents if i.status == IncidentStatus.OPEN]),
            "investigation_incidents": len([i for i in all_incidents if i.status == IncidentStatus.INVESTIGATING]),
            "closed_incidents": len([i for i in all_incidents if i.status == IncidentStatus.CLOSED]),
            "major_incidents": len([i for i in all_incidents if i.severity == IncidentSeverity.MAJOR]),
            "fatal_incidents": len([i for i in all_incidents if i.severity == IncidentSeverity.FATAL]),
            "pending_capas": len([c for c in all_capas if c.status == CAPAStatus.PENDING]),
            "overdue_capas": len([c for c in all_capas if c.status != CAPAStatus.COMPLETED and c.deadline < today]),
            "days_without_accident": days_without_accident
        }
        return stats