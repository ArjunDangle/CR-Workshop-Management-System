# FILE: server/app/modules/contractor/service.py
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional
from datetime import date, datetime
from fastapi import HTTPException, status

from app.modules.contractor.models import (
    Contractor, Worker, ContractorAudit, ContractorStatus,
    Contract, ContractChecklist, ContractObligation, GatePass, WorkerCertification,
    ChecklistPhase, ContractStatus, GatePassState, ObligationType
)
from app.modules.contractor.schemas import (
    ContractorCreate, ContractorUpdate, ContractorStatusUpdate,
    ContractCreate, WorkerCreate, WorkerUpdate, WorkerValidationResult,
    WorkerCertificationCreate
)

class ContractorService:
    
    @staticmethod
    def validate_contractor_for_permit(db: Session, contractor_id: UUID, empanelment_required: str = None) -> bool:
        """Safety Firewall: Validates Contractor Company Rules."""
        contractor = db.get(Contractor, contractor_id)
        if not contractor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Contractor not found")
        
        if contractor.status in [ContractorStatus.BLACKLISTED, ContractorStatus.SUSPENDED]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Contractor {contractor.company_name} is {contractor.status.value}")
        
        today = date.today()
        if contractor.empanelment_valid_upto < today:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Empanelment expired on {contractor.empanelment_valid_upto}")
        
        if contractor.insurance_valid_upto and contractor.insurance_valid_upto < today:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insurance expired on {contractor.insurance_valid_upto}")
            
        if empanelment_required and contractor.empanelment_category != "GENERAL" and contractor.empanelment_category != empanelment_required:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Contractor not empanelled for {empanelment_required} works.")
        
        return True
    
    @staticmethod
    def create_contractor(db: Session, contractor_data: ContractorCreate) -> Contractor:
        # Check unique constraints
        if db.execute(select(Contractor).where(Contractor.vendor_code == contractor_data.vendor_code)).scalars().first():
            raise HTTPException(status_code=400, detail="Vendor code already exists")
        if db.execute(select(Contractor).where(Contractor.company_name == contractor_data.company_name)).scalars().first():
            raise HTTPException(status_code=400, detail="Company name already exists")
        
        # Subcontractor verification
        if contractor_data.parent_contractor_id:
            parent = db.get(Contractor, contractor_data.parent_contractor_id)
            if not parent:
                raise HTTPException(status_code=404, detail="Parent contractor not found")

        contractor = Contractor.model_validate(contractor_data.model_dump())
        db.add(contractor)
        db.commit()
        db.refresh(contractor)
        return contractor
    
    @staticmethod
    def get_contractors(db: Session, status: Optional[ContractorStatus] = None) -> List[Contractor]:
        query = select(Contractor).options(selectinload(Contractor.subcontractors))
        if status:
            query = query.where(Contractor.status == status)
        return db.execute(query.order_by(Contractor.company_name)).scalars().all()
    
    @staticmethod
    def get_contractor_by_id(db: Session, contractor_id: UUID) -> Contractor:
        contractor = db.execute(
            select(Contractor).options(selectinload(Contractor.subcontractors)).where(Contractor.id == contractor_id)
        ).scalar_one_or_none()
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
        return contractor


class ContractService:
    @staticmethod
    def create_contract(db: Session, data: ContractCreate) -> Contract:
        contractor = db.get(Contractor, data.contractor_id)
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
        
        contract = Contract.model_validate(data.model_dump())
        db.add(contract)
        db.flush()
        
        # Auto-seed Standard Mobilization Checklist
        default_mob_tasks =["Submit Insurance Details", "Worker ID Card List Provided", "Site Familiarization Completed", "Tools & Plant Inspected"]
        for task in default_mob_tasks:
            chk = ContractChecklist(contract_id=contract.id, phase=ChecklistPhase.MOBILIZATION, task_name=task)
            db.add(chk)
            
        # Auto-seed Standard Obligations
        if contract.end_date:
            obl = ContractObligation(
                contract_id=contract.id, title="Initial PF/ESI Submission",
                type=ObligationType.PF_ESI, due_date=date.today()
            )
            db.add(obl)

        db.commit()
        db.refresh(contract)
        return contract
        
    @staticmethod
    def get_contracts_by_contractor(db: Session, contractor_id: UUID) -> List[Contract]:
        query = select(Contract).options(selectinload(Contract.checklists), selectinload(Contract.obligations)).where(Contract.contractor_id == contractor_id)
        return db.execute(query).scalars().all()
        
    @staticmethod
    def toggle_checklist_item(db: Session, checklist_id: UUID, user_id: UUID) -> ContractChecklist:
        item = db.get(ContractChecklist, checklist_id)
        if not item:
            raise HTTPException(status_code=404, detail="Checklist item not found")
            
        item.is_completed = not item.is_completed
        item.completed_at = datetime.utcnow() if item.is_completed else None
        item.completed_by_id = user_id if item.is_completed else None
        db.add(item)
        db.flush()
        
        # Recalculate Contract Progress
        contract = db.get(Contract, item.contract_id)
        phase_items =[c for c in contract.checklists if c.phase == item.phase]
        completed = sum(1 for c in phase_items if c.is_completed)
        progress = (completed / len(phase_items)) * 100 if len(phase_items) > 0 else 0
        
        if item.phase == ChecklistPhase.MOBILIZATION:
            contract.mobilization_progress = progress
        else:
            contract.demobilization_progress = progress
            
        db.add(contract)
        db.commit()
        db.refresh(item)
        return item


class WorkerService:
    
    @staticmethod
    def validate_worker_for_permit(db: Session, worker_id: UUID) -> bool:
        worker = db.get(Worker, worker_id)
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        if worker.is_blacklisted:
            raise HTTPException(status_code=400, detail=f"Worker {worker.full_name} is blacklisted.")
        
        today = date.today()
        if worker.medical_valid_upto < today:
            raise HTTPException(status_code=400, detail=f"{worker.full_name} medical expired.")
        if worker.safety_training_valid_upto < today:
            raise HTTPException(status_code=400, detail=f"{worker.full_name} safety training expired.")
            
        return True

    @staticmethod
    def create_worker(db: Session, worker_data: WorkerCreate) -> Worker:
        if db.execute(select(Worker).where(Worker.id_proof_number == worker_data.id_proof_number)).scalars().first():
            raise HTTPException(status_code=400, detail="Worker ID proof already exists")
            
        worker = Worker.model_validate(worker_data.model_dump())
        db.add(worker)
        db.commit()
        db.refresh(worker)
        return worker
        
    @staticmethod
    def get_workers_by_contractor(db: Session, contractor_id: UUID) -> List[Worker]:
        return db.execute(select(Worker).options(selectinload(Worker.certifications)).where(Worker.contractor_id == contractor_id)).scalars().all()

    @staticmethod
    def process_gate_scan(db: Session, worker_id: UUID, direction: str, scanned_by: UUID) -> GatePass:
        """The Enterprise Gate Pass Logic"""
        worker = db.get(Worker, worker_id)
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
            
        if direction.upper() == "IN":
            if worker.gate_pass_state == GatePassState.INSIDE:
                raise HTTPException(status_code=400, detail="Worker is already INSIDE the workshop.")
                
            # SAFETY FIREWALL CHECK
            today = date.today()
            deny_reason = None
            if worker.is_blacklisted:
                deny_reason = "WORKER IS BLACKLISTED"
            elif worker.medical_valid_upto < today:
                deny_reason = f"Medical expired on {worker.medical_valid_upto}"
            elif worker.safety_training_valid_upto < today:
                deny_reason = f"Safety training expired on {worker.safety_training_valid_upto}"
                
            if deny_reason:
                # Log the denied attempt
                gp = GatePass(worker_id=worker.id, status="DENIED", denial_reason=deny_reason, scanned_by_id=scanned_by)
                db.add(gp)
                db.commit()
                raise HTTPException(status_code=403, detail=f"ACCESS DENIED: {deny_reason}")
                
            # Allow Entry
            gp = GatePass(worker_id=worker.id, status="APPROVED", scanned_by_id=scanned_by)
            worker.gate_pass_state = GatePassState.INSIDE
            db.add(gp)
            db.add(worker)
            db.commit()
            db.refresh(gp)
            return gp
            
        elif direction.upper() == "OUT":
            if worker.gate_pass_state == GatePassState.OUTSIDE:
                raise HTTPException(status_code=400, detail="Worker is already OUTSIDE.")
            
            # Find the open gate pass
            active_gp = db.execute(select(GatePass).where(GatePass.worker_id == worker.id, GatePass.exit_time == None, GatePass.status == "APPROVED")).scalars().first()
            if active_gp:
                active_gp.exit_time = datetime.utcnow()
                db.add(active_gp)
                
            worker.gate_pass_state = GatePassState.OUTSIDE
            db.add(worker)
            db.commit()
            return active_gp or GatePass(worker_id=worker.id, status="MANUAL_OUT")
            
        else:
            raise HTTPException(status_code=400, detail="Direction must be IN or OUT")

contractor_service = ContractorService()
contract_service = ContractService()
worker_service = WorkerService()