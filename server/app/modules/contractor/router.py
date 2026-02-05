from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.modules.contractor.models import ContractorStatus
from app.modules.contractor.schemas import (
    ContractorCreate,
    ContractorRead,
    ContractorUpdate,
    ContractorStatusUpdate,
    WorkerCreate,
    WorkerRead,
    WorkerUpdate,
    WorkerValidationResult
)
from app.modules.contractor.service import (
    contractor_service,
    worker_service
)

router = APIRouter(prefix="/contractors", tags=["contractors"])


# Contractor Endpoints
@router.post("/", response_model=ContractorRead, status_code=status.HTTP_201_CREATED)
def create_contractor(
    contractor_data: ContractorCreate,
    db: Session = Depends(get_db)
):
    """Register a new contractor/vendor."""
    return contractor_service.create_contractor(db, contractor_data)


@router.get("/", response_model=List[ContractorRead])
def get_contractors(
    status: ContractorStatus = Query(None, description="Filter by contractor status"),
    db: Session = Depends(get_db)
):
    """List all contractors, optionally filtered by status."""
    return contractor_service.get_contractors(db, status)


@router.get("/{contractor_id}", response_model=ContractorRead)
def get_contractor(
    contractor_id: UUID,
    db: Session = Depends(get_db)
):
    """Get contractor details by ID."""
    return contractor_service.get_contractor_by_id(db, contractor_id)


@router.patch("/{contractor_id}", response_model=ContractorRead)
def update_contractor(
    contractor_id: UUID,
    contractor_data: ContractorUpdate,
    db: Session = Depends(get_db)
):
    """Update contractor details."""
    return contractor_service.update_contractor(db, contractor_id, contractor_data)


@router.patch("/{contractor_id}/status", response_model=ContractorRead)
def update_contractor_status(
    contractor_id: UUID,
    status_update: ContractorStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update contractor status with audit trail."""
    # TODO: Get current user from auth context for audit trail
    changed_by = "system"  # This should come from authentication
    return contractor_service.update_contractor_status(
        db, contractor_id, status_update, changed_by
    )


# Worker Endpoints
@router.post("/{contractor_id}/workers", response_model=WorkerRead, status_code=status.HTTP_201_CREATED)
def create_worker(
    contractor_id: UUID,
    worker_data: WorkerCreate,
    db: Session = Depends(get_db)
):
    """Add a worker to a specific contractor."""
    # Override contractor_id from path to ensure consistency
    worker_data.contractor_id = contractor_id
    return worker_service.create_worker(db, worker_data)


@router.get("/{contractor_id}/workers", response_model=List[WorkerRead])
def get_contractor_workers(
    contractor_id: UUID,
    db: Session = Depends(get_db)
):
    """List all workers for a specific contractor."""
    workers = worker_service.get_workers_by_contractor(db, contractor_id)
    # Add contractor_name to each worker for frontend convenience
    contractor = contractor_service.get_contractor_by_id(db, contractor_id)
    for worker in workers:
        worker.contractor_name = contractor.company_name
    return workers


# Worker-specific endpoints (standalone)
worker_router = APIRouter(prefix="/workers", tags=["workers"])


@worker_router.get("/{worker_id}", response_model=WorkerRead)
def get_worker(
    worker_id: UUID,
    db: Session = Depends(get_db)
):
    """Get worker details by ID."""
    worker = worker_service.get_worker_by_id(db, worker_id)
    # Add contractor_name for frontend convenience
    contractor = contractor_service.get_contractor_by_id(db, worker.contractor_id)
    worker.contractor_name = contractor.company_name
    return worker


@worker_router.patch("/{worker_id}", response_model=WorkerRead)
def update_worker(
    worker_id: UUID,
    worker_data: WorkerUpdate,
    db: Session = Depends(get_db)
):
    """Update worker details."""
    return worker_service.update_worker(db, worker_id, worker_data)


@worker_router.get("/{worker_id}/validate", response_model=WorkerValidationResult)
def validate_worker_for_permit(
    worker_id: UUID,
    db: Session = Depends(get_db)
):
    """Validate if a worker is eligible for work permits (Frontend Helper)."""
    return worker_service.validate_worker_for_permit_with_result(db, worker_id)


# Include both routers
router.include_router(worker_router)