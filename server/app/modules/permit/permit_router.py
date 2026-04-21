# FILE: server/app/modules/permit/permit_router.py
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models import User
from app.modules.auth.auth_dependencies import get_current_active_user
from app.modules.permit import permit_service, permit_schemas

router = APIRouter(dependencies=[Depends(get_current_active_user)])

@router.post("/", response_model=permit_schemas.PermitRead, status_code=status.HTTP_201_CREATED)
def create_new_permit(permit_data: permit_schemas.PermitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.create_permit(db=db, permit_data=permit_data, permittee=current_user)

@router.get("/", response_model=List[permit_schemas.PermitRead])
def get_user_permits(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.get_permits_for_user(db=db, user=current_user)

@router.get("/{permit_id}", response_model=permit_schemas.PermitRead)
def get_permit_details(permit_id: UUID, db: Session = Depends(get_db)):
    return permit_service.get_permit_by_id(db=db, permit_id=permit_id)

@router.get("/{permit_id}/conflicts", response_model=permit_schemas.PermitConflictReport)
def get_permit_conflicts(permit_id: UUID, db: Session = Depends(get_db)):
    return permit_service.check_permit_conflicts(db=db, permit_id=permit_id)

@router.put("/{permit_id}/authorize", response_model=permit_schemas.PermitRead)
def authorize_permit_action(permit_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.authorize_permit(db=db, permit_id=permit_id, authorizer=current_user)

@router.put("/{permit_id}/approve", response_model=permit_schemas.PermitRead)
def approve_permit_action(permit_id: UUID, permit_data: permit_schemas.PermitApprove, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.approve_permit(db=db, permit_id=permit_id, permit_data=permit_data, approver=current_user)

@router.put("/{permit_id}/activate", response_model=permit_schemas.PermitRead)
def activate_permit_action(permit_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.activate_permit(db=db, permit_id=permit_id, user=current_user)

@router.post("/{permit_id}/handback", response_model=permit_schemas.PermitRead)
def submit_handback_action(permit_id: UUID, handback_data: permit_schemas.PermitHandback, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.submit_handback(db=db, permit_id=permit_id, handback_data=handback_data, user=current_user)

@router.put("/{permit_id}/verify-closure", response_model=permit_schemas.PermitRead)
def verify_closure_action(permit_id: UUID, verify_data: permit_schemas.PermitVerifyClosure, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.verify_closure(db=db, permit_id=permit_id, verify_data=verify_data, user=current_user)

@router.post("/{permit_id}/request-extension", response_model=permit_schemas.PermitRead)
def request_extension_action(permit_id: UUID, extension_data: permit_schemas.PermitExtensionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.request_permit_extension(db=db, permit_id=permit_id, extension_data=extension_data, user=current_user)

@router.put("/{permit_id}/approve-extension", response_model=permit_schemas.PermitRead)
def approve_extension_action(permit_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return permit_service.approve_permit_extension(db=db, permit_id=permit_id, authorizer=current_user)