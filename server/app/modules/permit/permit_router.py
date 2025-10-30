# FILE: server/app/modules/permit/permit_router.py
"""
API Router for the Permit Management Module.
Handles all HTTP requests related to permits.
"""
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models import User
from app.modules.auth.auth_dependencies import get_current_active_user
from app.modules.permit import permit_service, permit_schemas

router = APIRouter(
    # All routes in this router will require an authenticated user
    dependencies=[Depends(get_current_active_user)]
)

@router.post(
    "/", 
    response_model=permit_schemas.PermitRead, 
    status_code=status.HTTP_201_CREATED,
    summary="Create a new work permit"
)
def create_new_permit(
    permit_data: permit_schemas.PermitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new work permit. The logged-in user will be set as the permittee.
    
    The backend will automatically determine the `permit_type` (Height/Electrical)
    based on the user's role.
    
    The request body should contain all form fields, including the
    nested `ppes` and `attendees` lists.
    """
    return permit_service.create_permit(db=db, permit_data=permit_data, permittee=current_user)


@router.get(
    "/", 
    response_model=List[permit_schemas.PermitRead],
    summary="Get relevant permits for current user"
)
def get_user_permits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetches a list of permits relevant to the logged-in user's role:
    - **SSE-Maintenance**: Sees all permits they have initiated.
    - **SSE-Office**: Sees all permits with status 'Pending Authorization'.
    - **Safety Officer**: Sees all permits with status 'Pending Approval'.
    
    All related data (ppes, attendees, users) is eagerly loaded.
    """
    return permit_service.get_permits_for_user(db=db, user=current_user)


@router.get(
    "/{permit_id}", 
    response_model=permit_schemas.PermitRead,
    summary="Get a single permit by ID"
)
def get_permit_details(
    permit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user) # Dependency ensures user is auth'd
):
    """
    Fetches the detailed information for a single permit by its UUID.
    All related data (ppes, attendees, users) is eagerly loaded.
    """
    # Note: Access control (e.g., can this user *see* this permit?) 
    # could be added here, but for now, any auth'd user can get by ID.
    return permit_service.get_permit_by_id(db=db, permit_id=permit_id)


@router.put(
    "/{permit_id}/authorize", 
    response_model=permit_schemas.PermitRead,
    summary="Authorize a permit (SSE-Office)"
)
def authorize_permit_action(
    permit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Authorize a permit. This action can only be performed by an **SSE-Office** user
    on a permit that is 'Pending Authorization'.
    Moves the permit status to 'Pending Approval'.
    """
    return permit_service.authorize_permit(db=db, permit_id=permit_id, authorizer=current_user)


@router.put(
    "/{permit_id}/approve", 
    response_model=permit_schemas.PermitRead,
    summary="Approve a permit (Safety Officer)"
)
def approve_permit_action(
    permit_id: UUID,
    permit_data: permit_schemas.PermitApprove, # Get remarks from request body
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve a permit. This action can only be performed by a **Safety Officer**
    on a permit that is 'Pending Approval'.
    
    The request body must contain the `approver_remarks`.
    Moves the permit status to 'Approved'.
    """
    return permit_service.approve_permit(
        db=db, 
        permit_id=permit_id, 
        permit_data=permit_data, 
        approver=current_user
    )