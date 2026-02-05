from sqlmodel import Session, select
from uuid import UUID
from typing import List, Optional
from datetime import date, datetime
from fastapi import HTTPException, status

from app.modules.contractor.models import (
    Contractor, 
    Worker, 
    ContractorAudit, 
    ContractorStatus
)
from app.modules.contractor.schemas import (
    ContractorCreate, 
    ContractorUpdate, 
    ContractorStatusUpdate,
    WorkerCreate, 
    WorkerUpdate,
    WorkerValidationResult
)


class ContractorService:
    
    @staticmethod
    def validate_contractor_for_permit(db: Session, contractor_id: UUID) -> bool:
        """
        Safety Firewall: Validates if a contractor is eligible for work permits.
        
        Args:
            db: Database session
            contractor_id: UUID of the contractor to validate
            
        Returns:
            True if contractor is eligible
            
        Raises:
            HTTPException: If contractor is not eligible for permit work
        """
        contractor = db.get(Contractor, contractor_id)
        if not contractor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contractor with ID {contractor_id} not found"
            )
        
        # Check 1: Status must be ACTIVE
        if contractor.status in [ContractorStatus.BLACKLISTED, ContractorStatus.SUSPENDED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contractor {contractor.company_name} is {contractor.status.value} and cannot work on permits"
            )
        
        # Check 2: Empanelment must be valid
        today = date.today()
        if contractor.empanelment_valid_upto < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contractor {contractor.company_name} empanelment expired on {contractor.empanelment_valid_upto}"
            )
        
        # Check 3: Insurance must be valid (if provided)
        if contractor.insurance_valid_upto and contractor.insurance_valid_upto < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contractor {contractor.company_name} insurance expired on {contractor.insurance_valid_upto}"
            )
        
        return True
    
    @staticmethod
    def validate_worker_for_permit(db: Session, worker_id: UUID) -> bool:
        """
        Safety Firewall: Validates if a worker is eligible for work permits.
        
        Args:
            db: Database session
            worker_id: UUID of the worker to validate
            
        Returns:
            True if worker is eligible
            
        Raises:
            HTTPException: If worker is not eligible for permit work
        """
        worker = db.get(Worker, worker_id)
        if not worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with ID {worker_id} not found"
            )
        
        # Check 1: Must not be blacklisted
        if worker.is_blacklisted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker {worker.full_name} is blacklisted and cannot work on permits"
            )
        
        # Check 2: Medical validity
        today = date.today()
        if worker.medical_valid_upto < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker {worker.full_name} medical fitness expired on {worker.medical_valid_upto}"
            )
        
        # Check 3: Safety training validity
        if worker.safety_training_valid_upto < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker {worker.full_name} safety training expired on {worker.safety_training_valid_upto}"
            )
        
        return True
    
    @staticmethod
    def log_audit_event(
        db: Session, 
        contractor_id: UUID, 
        action: str, 
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        changed_by: Optional[str] = None
    ) -> ContractorAudit:
        """
        Helper function to log audit events for contractors.
        """
        audit = ContractorAudit(
            contractor_id=contractor_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            changed_by=changed_by
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
    
    @staticmethod
    def create_contractor(db: Session, contractor_data: ContractorCreate) -> Contractor:
        """
        Creates a new contractor.
        """
        # Check if vendor_code already exists
        existing = db.exec(
            select(Contractor).where(Contractor.vendor_code == contractor_data.vendor_code)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contractor with vendor code {contractor_data.vendor_code} already exists"
            )
        
        # Check if company_name already exists
        existing = db.exec(
            select(Contractor).where(Contractor.company_name == contractor_data.company_name)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contractor with company name {contractor_data.company_name} already exists"
            )
        
        contractor = Contractor.model_validate(contractor_data.model_dump())
        db.add(contractor)
        db.commit()
        db.refresh(contractor)
        
        # Log creation
        ContractorService.log_audit_event(
            db, contractor.id, "CONTRACTOR_CREATED", 
            new_value=f"Created {contractor.company_name}"
        )
        
        return contractor
    
    @staticmethod
    def get_contractors(db: Session, status: Optional[ContractorStatus] = None) -> List[Contractor]:
        """
        Gets all contractors, optionally filtered by status.
        """
        query = select(Contractor)
        if status:
            query = query.where(Contractor.status == status)
        return db.exec(query.order_by(Contractor.company_name)).all()
    
    @staticmethod
    def get_contractor_by_id(db: Session, contractor_id: UUID) -> Contractor:
        """
        Gets a contractor by ID.
        """
        contractor = db.get(Contractor, contractor_id)
        if not contractor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contractor with ID {contractor_id} not found"
            )
        return contractor
    
    @staticmethod
    def update_contractor(db: Session, contractor_id: UUID, contractor_data: ContractorUpdate) -> Contractor:
        """
        Updates a contractor.
        """
        contractor = ContractorService.get_contractor_by_id(db, contractor_id)
        
        # Track changes for audit
        changes = []
        for field, value in contractor_data.model_dump(exclude_unset=True).items():
            if value is not None and getattr(contractor, field) != value:
                old_val = str(getattr(contractor, field))
                setattr(contractor, field, value)
                changes.append(f"{field}: {old_val} -> {value}")
        
        if changes:
            db.commit()
            db.refresh(contractor)
            
            # Log changes
            ContractorService.log_audit_event(
                db, contractor_id, "CONTRACTOR_UPDATED",
                old_value="; ".join(changes),
                new_value="Updated fields"
            )
        
        return contractor
    
    @staticmethod
    def update_contractor_status(
        db: Session, 
        contractor_id: UUID, 
        status_update: ContractorStatusUpdate,
        changed_by: str
    ) -> Contractor:
        """
        Updates contractor status and logs the change.
        """
        contractor = ContractorService.get_contractor_by_id(db, contractor_id)
        old_status = contractor.status.value
        
        contractor.status = status_update.status
        db.commit()
        db.refresh(contractor)
        
        # Log status change
        ContractorService.log_audit_event(
            db, contractor_id, "STATUS_CHANGED",
            old_value=f"Status: {old_status}",
            new_value=f"Status: {contractor.status.value}; Reason: {status_update.reason}",
            changed_by=changed_by
        )
        
        return contractor


class WorkerService:
    
    @staticmethod
    def create_worker(db: Session, worker_data: WorkerCreate) -> Worker:
        """
        Creates a new worker.
        """
        # Verify contractor exists
        contractor = db.get(Contractor, worker_data.contractor_id)
        if not contractor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contractor with ID {worker_data.contractor_id} not found"
            )
        
        # Check if ID proof number already exists
        existing = db.exec(
            select(Worker).where(Worker.id_proof_number == worker_data.id_proof_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker with ID proof number {worker_data.id_proof_number} already exists"
            )
        
        worker = Worker.model_validate(worker_data.model_dump())
        db.add(worker)
        db.commit()
        db.refresh(worker)
        
        return worker
    
    @staticmethod
    def get_workers_by_contractor(db: Session, contractor_id: UUID) -> List[Worker]:
        """
        Gets all workers for a specific contractor.
        """
        return db.exec(
            select(Worker).where(Worker.contractor_id == contractor_id)
            .order_by(Worker.full_name)
        ).all()
    
    @staticmethod
    def get_worker_by_id(db: Session, worker_id: UUID) -> Worker:
        """
        Gets a worker by ID.
        """
        worker = db.get(Worker, worker_id)
        if not worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with ID {worker_id} not found"
            )
        return worker
    
    @staticmethod
    def update_worker(db: Session, worker_id: UUID, worker_data: WorkerUpdate) -> Worker:
        """
        Updates a worker.
        """
        worker = WorkerService.get_worker_by_id(db, worker_id)
        
        for field, value in worker_data.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(worker, field, value)
        
        db.commit()
        db.refresh(worker)
        
        return worker
    
    @staticmethod
    def validate_worker_for_permit_with_result(db: Session, worker_id: UUID) -> WorkerValidationResult:
        """
        Validates worker and returns result object (for frontend).
        """
        try:
            ContractorService.validate_worker_for_permit(db, worker_id)
            return WorkerValidationResult(is_eligible=True)
        except HTTPException as e:
            return WorkerValidationResult(is_eligible=False, reason=e.detail)


# Create singleton instances for convenience
contractor_service = ContractorService()
worker_service = WorkerService()