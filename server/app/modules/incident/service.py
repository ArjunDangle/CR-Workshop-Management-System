# FILE: server/app/modules/incident/service.py
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta, timezone
from sqlmodel import Session, select
from fastapi import HTTPException, status

from .models import Incident, CAPA, IncidentWitness, IncidentVictim, Investigation, IncidentSeverity, IncidentStatus, CAPAStatus, ReviewStatus, InvestigationStatus
from .schemas import IncidentCreate, CAPACreate, IncidentWitnessCreate, IncidentReviewUpdate
from app.modules.machine.machine_models import Machine
from app.modules.contractor.models import Worker
import app.modules.machine.machine_service as machine_service
import app.modules.permit.permit_service as permit_service

class IncidentService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_incident_code(self) -> str:
        year = datetime.now().year
        count_this_year = self.db.execute(
            select(Incident).where(Incident.incident_code.like(f"INC-{year}-%"))
        ).raw.rowcount
        return f"INC-{year}-{(count_this_year or 0) + 1:04d}"

    def create_incident(self, incident_data: IncidentCreate) -> Incident:
        try:
            new_code = self._generate_incident_code()
            
            # Exclude nested lists from main Incident creation
            incident_dict = incident_data.model_dump(exclude={"victim_ids", "witnesses", "investigation", "capas"})
            incident_dict["incident_code"] = new_code
            
            hours_to_investigate = 24 if incident_data.severity in [IncidentSeverity.MAJOR, IncidentSeverity.FATAL, IncidentSeverity.CRITICAL] else 72
            incident_dict["investigation_due_at"] = datetime.now(timezone.utc) + timedelta(hours=hours_to_investigate)
            
            # Adjust Initial Status if RCA/CAPA is provided
            if incident_data.investigation:
                incident_dict["status"] = IncidentStatus.CAPA_PENDING if incident_data.capas else IncidentStatus.INVESTIGATING
            
            incident = Incident.model_validate(incident_dict)
            self.db.add(incident)
            self.db.flush()

            # 1. Process Victims
            if incident_data.victim_ids:
                for v_id in incident_data.victim_ids:
                    worker = self.db.get(Worker, v_id)
                    victim = IncidentVictim(
                        incident_id=incident.id,
                        worker_id=v_id,
                        full_name=worker.full_name if worker else "Unknown",
                        injury_details="Pending medical assessment"
                    )
                    self.db.add(victim)

            # 2. Process Witnesses
            if incident_data.witnesses:
                for w_data in incident_data.witnesses:
                    witness = IncidentWitness.model_validate(w_data, update={"incident_id": incident.id})
                    self.db.add(witness)

            # 3. Process Investigation (4M RCA)
            if incident_data.investigation and incident_data.investigation.conclusion:
                inv_data = incident_data.investigation.model_dump()
                inv_data["incident_id"] = incident.id
                inv_data["investigated_by_id"] = incident.reported_by_id
                inv_data["status"] = InvestigationStatus.COMPLETED
                investigation = Investigation(**inv_data)
                self.db.add(investigation)

            # 4. Process CAPAs
            if incident_data.capas:
                for c_data in incident_data.capas:
                    capa = CAPA.model_validate(c_data, update={"incident_id": incident.id})
                    self.db.add(capa)

            # Enforce Kill Switch
            if incident.severity in [IncidentSeverity.MAJOR, IncidentSeverity.FATAL, IncidentSeverity.CRITICAL]:
                self._enforce_kill_switch(incident)

            self.db.commit()
            self.db.refresh(incident)
            return incident
            
        except Exception as e:
            self.db.rollback()
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
        if new_status == IncidentStatus.CLOSED:
            incident.resolved_at = datetime.now(timezone.utc)
            
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def link_resolution_permit(self, incident_id: UUID, permit_id: UUID) -> Incident:
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        incident.resolution_permit_id = permit_id
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def review_incident(self, incident_id: UUID, reviewer_id: UUID, review_data: IncidentReviewUpdate) -> Incident:
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        incident.reviewed_by_id = reviewer_id
        incident.review_status = review_data.review_status
        incident.review_remarks = review_data.review_remarks
        
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def add_witness(self, incident_id: UUID, witness_data: IncidentWitnessCreate) -> IncidentWitness:
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        witness = IncidentWitness.model_validate(witness_data, update={"incident_id": incident_id})
        self.db.add(witness)
        self.db.commit()
        self.db.refresh(witness)
        return witness

    def _enforce_kill_switch(self, incident: Incident):
        print(f"🚨 KILL SWITCH ACTIVATED for Incident {incident.incident_code} 🚨")
        incident.is_work_stopped = True
        if incident.machine_id:
            machine_service.lock_machine_status(self.db, incident.machine_id, commit=False)
            print(f"   -> Machine {incident.machine_id} locked.")
        if incident.permit_id:
            permit_service.suspend_permit(self.db, incident.permit_id, commit=False)
            print(f"   -> Permit {incident.permit_id} suspended.")

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
        today = date.today()
        last_major_incident = self.db.execute(
            select(Incident).where(Incident.severity.in_([IncidentSeverity.MAJOR, IncidentSeverity.FATAL]))
            .order_by(Incident.occurred_at.desc())
        ).scalars().first()
        
        days_without_accident = (today - last_major_incident.occurred_at.date()).days if last_major_incident else 365
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