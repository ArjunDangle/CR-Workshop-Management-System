from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta
from sqlmodel import Session, select

from app.modules.incident.models import (
    Incident, CAPA, IncidentSeverity, IncidentStatus, CAPAStatus, CAPAType,
    IncidentCategory
)
from app.modules.machine.machine_models import Machine
import app.modules.machine.machine_service as machine_service
import app.modules.permit.permit_service as permit_service
import app.modules.contractor.service as contractor_service


class IncidentService:
    def __init__(self, db: Session):
        self.db = db

    def create_incident(self, incident_data: dict) -> Incident:
        """
        Create a new incident and enforce kill switch if necessary.
        
        Uses atomic transactions to ensure that if kill switch fails,
        the incident is not saved (rollback).
        """
        try:
            # 1. Create Incident Instance
            incident = Incident(**incident_data)
            
            # Validate linked entities if provided
            if incident.machine_id:
                machine = self.db.get(Machine, incident.machine_id)
                if not machine:
                    raise ValueError(f"Machine with ID {incident.machine_id} not found")
            
            if incident.permit_id:
                from app.modules.permit import permit_repo
                permit = permit_repo.get_permit_by_id(self.db, incident.permit_id)
                if not permit:
                    raise ValueError(f"Permit with ID {incident.permit_id} not found")
            
            if incident.contractor_id:
                contractor = contractor_service.get_contractor_by_id(self.db, incident.contractor_id)
                if not contractor:
                    raise ValueError(f"Contractor with ID {incident.contractor_id} not found")
            
            # Add to session but don't commit yet (flush generates ID)
            self.db.add(incident)
            self.db.flush()  # Generates ID, does not commit
            
            # 2. Check Logic & Enforce Kill Switch BEFORE commit
            if incident.severity in [IncidentSeverity.MAJOR, IncidentSeverity.FATAL]:
                self._enforce_kill_switch(self.db, incident)
            
            # 3. Final Atomic Commit (only if everything succeeded)
            self.db.commit()
            self.db.refresh(incident)
            return incident
            
        except Exception as e:
            # Revert Incident creation AND any Kill Switch actions
            self.db.rollback()
            raise e

    def get_incident_by_id(self, incident_id: UUID) -> Optional[Incident]:
        """Get incident by ID with all related data"""
        statement = select(Incident).where(Incident.id == incident_id)
        return self.db.exec(statement).first()

    def get_all_incidents(self) -> List[Incident]:
        """Get all incidents"""
        statement = select(Incident)
        return self.db.exec(statement).all()

    def get_incidents_by_severity(self, severity: IncidentSeverity) -> List[Incident]:
        """Get incidents by severity"""
        statement = select(Incident).where(Incident.severity == severity)
        return self.db.exec(statement).all()

    def get_incidents_by_status(self, status: IncidentStatus) -> List[Incident]:
        """Get incidents by status"""
        statement = select(Incident).where(Incident.status == status)
        return self.db.exec(statement).all()

    def update_incident_status(self, incident_id: UUID, status: IncidentStatus) -> Incident:
        """Update incident status"""
        incident = self.get_incident_by_id(incident_id)
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found")
        
        incident.status = status
        incident.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def _enforce_kill_switch(self, db: Session, incident: Incident):
        """
        Enforce kill switch for MAJOR and FATAL incidents.
        
        This function does NOT commit - it runs within the parent transaction.
        If any operation fails, the entire transaction (including incident creation) will rollback.
        
        Args:
            db: Database session (passed explicitly for transaction control)
            incident: The incident that triggered the kill switch
        """
        # Stop all active permits using the correct status string
        from app.modules.permit import permit_repo
        active_permits = permit_repo.get_permits_by_status(db, "Active")  # Fixed: "Active" not "ACTIVE"
        
        for permit in active_permits:
            # Use service method instead of direct modification
            permit_service.suspend_permit(
                db=db,
                permit_id=permit.id,
                reason=f"Severe Incident: {incident.severity.value}",
                commit=False  # Don't commit - part of parent transaction
            )
        
        # Set all machines to UNDER_MAINTENANCE
        all_machines = machine_service.get_all_machines(db)
        for machine_data in all_machines:
            machine_id = machine_data.get('id')
            if machine_id:
                # Pass commit=False to keep within transaction
                machine_service.lock_machine_status(db, machine_id, commit=False)

    def create_capa(self, capa_data: dict) -> CAPA:
        """Create a new CAPA"""
        # Verify incident exists
        incident = self.get_incident_by_id(capa_data["incident_id"])
        if not incident:
            raise ValueError(f"Incident with ID {capa_data['incident_id']} not found")
        
        # Set due date based on CAPA type
        if "due_date" not in capa_data:
            if capa_data.get("type") == CAPAType.CORRECTIVE:
                capa_data["due_date"] = date.today() + timedelta(days=7)
            else:
                capa_data["due_date"] = date.today() + timedelta(days=30)
        
        capa = CAPA(**capa_data)
        self.db.add(capa)
        self.db.commit()
        self.db.refresh(capa)
        
        # Update incident status if needed
        if incident.status == IncidentStatus.CLOSED:
            incident.status = IncidentStatus.CAPA_PENDING
            self.db.commit()
        
        return capa

    def get_capa_by_id(self, capa_id: UUID) -> Optional[CAPA]:
        """Get CAPA by ID"""
        statement = select(CAPA).where(CAPA.id == capa_id)
        return self.db.exec(statement).first()

    def get_capas_by_incident_id(self, incident_id: UUID) -> List[CAPA]:
        """Get all CAPAs for an incident"""
        statement = select(CAPA).where(CAPA.incident_id == incident_id)
        return self.db.exec(statement).all()

    def get_capas_by_status(self, status: CAPAStatus) -> List[CAPA]:
        """Get CAPAs by status"""
        statement = select(CAPA).where(CAPA.status == status)
        return self.db.exec(statement).all()

    def update_capa_status(self, capa_id: UUID, status: CAPAStatus) -> CAPA:
        """Update CAPA status"""
        capa = self.get_capa_by_id(capa_id)
        if not capa:
            raise ValueError(f"CAPA with ID {capa_id} not found")
        
        capa.status = status
        capa.updated_at = datetime.utcnow()
        
        if status == CAPAStatus.COMPLETED:
            capa.completed_date = date.today()
        
        self.db.commit()
        self.db.refresh(capa)
        
        # Check if all CAPAs for the incident are completed
        if status == CAPAStatus.COMPLETED:
            all_capas = self.get_capas_by_incident_id(capa.incident_id)
            if all(c.status == CAPAStatus.COMPLETED for c in all_capas):
                incident = self.get_incident_by_id(capa.incident_id)
                if incident:
                    incident.status = IncidentStatus.CLOSED
                    self.db.commit()
        
        return capa

    def get_overdue_capas(self) -> List[CAPA]:
        """Get all overdue CAPAs"""
        today = date.today()
        statement = select(CAPA).where(
            CAPA.due_date < today,
            CAPA.status.in_([CAPAStatus.PENDING, CAPAStatus.IN_PROGRESS])
        )
        capas = self.db.exec(statement).all()
        
        # Update status to OVERDUE
        for capa in capas:
            capa.status = CAPAStatus.OVERDUE
            capa.updated_at = datetime.utcnow()
        
        self.db.commit()
        return capas

    def get_incident_statistics(self) -> dict:
        """Get incident statistics for dashboard"""
        stats = {
            "total_incidents": len(self.get_all_incidents()),
            "open_incidents": len(self.get_incidents_by_status(IncidentStatus.OPEN)),
            "investigation": len(self.get_incidents_by_status(IncidentStatus.INVESTIGATION)),
            "closed_incidents": len(self.get_incidents_by_status(IncidentStatus.CLOSED)),
            "minor_incidents": len(self.get_incidents_by_severity(IncidentSeverity.MINOR)),
            "major_incidents": len(self.get_incidents_by_severity(IncidentSeverity.MAJOR)),
            "fatal_incidents": len(self.get_incidents_by_severity(IncidentSeverity.FATAL)),
            "pending_capas": len(self.get_capas_by_status(CAPAStatus.PENDING)),
            "overdue_capas": len(self.get_capas_by_status(CAPAStatus.OVERDUE)),
            "completed_capas": len(self.get_capas_by_status(CAPAStatus.COMPLETED))
        }
        return stats