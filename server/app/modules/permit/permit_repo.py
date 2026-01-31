# FILE: server/app/modules/permit/permit_repo.py
"""
Repository Layer for the Permit Management Module.
Handles all database interactions for permits.
"""
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload # <-- Import for eager loading
from uuid import UUID
from typing import List, Optional

from app.models import Permit, User, PermitPPE, PermitAttendee

def create_permit(db: Session, permit: Permit) -> Permit:
    """
    Adds a new Permit object (with its relationships already populated)
    to the database in a single transaction.
    """
    # Add the single parent object to the session.
    # The ORM will automatically handle the related ppes and attendees.
    db.add(permit)
    db.commit()
    db.refresh(permit)
    return permit

def get_permit_by_id(db: Session, permit_id: UUID) -> Optional[Permit]:
    """
    Fetches a single permit by its ID, eagerly loading all related
    users, ppe, and attendee data.
    """
    statement = select(Permit).where(Permit.id == permit_id).options(
        selectinload(Permit.permittee).selectinload(User.role), # Load permittee and their role
        selectinload(Permit.authorizer).selectinload(User.role), # Load authorizer and their role
        selectinload(Permit.approver).selectinload(User.role), # Load approver and their role
        selectinload(Permit.ppes),      # Load all related PPE items
        selectinload(Permit.attendees) # Load all related attendees
    )
    permit = db.execute(statement).scalar_one_or_none()
    return permit

def get_permits_by_status(db: Session, status: str) -> List[Permit]:
    """
    Fetches all permits matching a specific status, eagerly loading
    all related data for each permit.
    """
    statement = select(Permit).where(Permit.status == status).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    )
    permits = db.execute(statement).scalars().all()
    return permits

def get_permits_by_permittee_id(db: Session, user_id: UUID) -> List[Permit]:
    """
    Fetches all permits initiated by a specific user, eagerly loading
    all related data for each permit.
    """
    statement = select(Permit).where(Permit.permittee_id == user_id).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    )
    permits = db.execute(statement).scalars().all()
    return permits

def update_permit(db: Session, permit: Permit) -> Permit:
    """
    After modifications in the service layer, this function
    commits the changes to the database and refreshes the permit instance.
    """
    db.add(permit)  # Add the modified permit object to the session
    db.commit()     # Commit the transaction to save changes
    db.refresh(permit) # Refresh the permit object to get the updated state from the DB
    
    # The relationships (ppes, attendees, authorizer, etc.) are automatically
    # managed by the ORM and will be correctly loaded on next access.
    # No need to refresh them individually.
    
    return permit