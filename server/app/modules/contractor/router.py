# FILE: server/app/modules/contractor/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.modules.auth.auth_dependencies import get_current_active_user
from app.models import User
from app.modules.contractor.models import ContractorStatus
from app.modules.contractor.schemas import (
    ContractorCreate, ContractorRead, ContractorTreeRead, ContractorUpdate, ContractorStatusUpdate,
    ContractCreate, ContractRead,
    WorkerCreate, WorkerRead, WorkerUpdate, WorkerValidationResult,
    GatePassScan, GatePassRead
)
from app.modules.contractor.service import contractor_service, worker_service, contract_service

router = APIRouter(prefix="/contractors", tags=["contractors"])

# --- CONTRACTOR ENDPOINTS ---
@router.post("/", response_model=ContractorRead, status_code=status.HTTP_201_CREATED)
def create_contractor(contractor_data: ContractorCreate, db: Session = Depends(get_db)):
    return contractor_service.create_contractor(db, contractor_data)

@router.get("/", response_model=List[ContractorTreeRead])
def get_contractors(status: ContractorStatus = Query(None), db: Session = Depends(get_db)):
    # Tree Read automatically nests subcontractors
    return contractor_service.get_contractors(db, status)

@router.get("/{contractor_id}", response_model=ContractorTreeRead)
def get_contractor(contractor_id: UUID, db: Session = Depends(get_db)):
    return contractor_service.get_contractor_by_id(db, contractor_id)

# --- CONTRACT ENDPOINTS (Jobs/Tenders) ---
@router.post("/{contractor_id}/contracts", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(contractor_id: UUID, data: ContractCreate, db: Session = Depends(get_db)):
    data.contractor_id = contractor_id
    return contract_service.create_contract(db, data)

@router.get("/{contractor_id}/contracts", response_model=List[ContractRead])
def get_contracts(contractor_id: UUID, db: Session = Depends(get_db)):
    return contract_service.get_contracts_by_contractor(db, contractor_id)

@router.patch("/checklists/{checklist_id}/toggle")
def toggle_contract_checklist(checklist_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return contract_service.toggle_checklist_item(db, checklist_id, current_user.id)

# --- WORKER ENDPOINTS ---
@router.get("/{contractor_id}/workers", response_model=List[WorkerRead])
def get_contractor_workers(contractor_id: UUID, db: Session = Depends(get_db)):
    contractor = contractor_service.get_contractor_by_id(db, contractor_id)
    workers = worker_service.get_workers_by_contractor(db, contractor_id)
    results =[]
    for worker in workers:
        worker_data = WorkerRead.model_validate(worker)
        worker_data.contractor_name = contractor.company_name
        results.append(worker_data)
    return results

worker_router = APIRouter(prefix="/workers", tags=["workers"])

@worker_router.post("/{worker_id}/gate-scan", response_model=GatePassRead)
def scan_worker_gate_pass(
    worker_id: UUID, 
    scan_data: GatePassScan, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """The RPF Security Gate Scan Endpoint"""
    return worker_service.process_gate_scan(db, worker_id, scan_data.direction, current_user.id)

@worker_router.get("/{worker_id}/validate", response_model=WorkerValidationResult)
def validate_worker_for_permit(worker_id: UUID, db: Session = Depends(get_db)):
    try:
        worker_service.validate_worker_for_permit(db, worker_id)
        return WorkerValidationResult(is_eligible=True)
    except HTTPException as e:
        return WorkerValidationResult(is_eligible=False, reason=e.detail)

router.include_router(worker_router)