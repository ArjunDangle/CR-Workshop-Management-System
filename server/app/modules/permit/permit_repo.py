# FILE: server/app/modules/permit/permit_repo.py
"""
Repository Layer for the Permit Management Module.
Handles all database interactions for permits.
"""
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional

from app.models import Permit, User

def create_permit(db: Session, permit: Permit) -> Permit:
    db.add(permit)
    db.commit()
    db.refresh(permit)
    return permit

def get_permit_by_id(db: Session, permit_id: UUID) -> Optional[Permit]:
    statement = select(Permit).where(Permit.id == permit_id).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    )
    return db.execute(statement).scalar_one_or_none()

def get_permits_by_status(db: Session, status: str) -> List[Permit]:
    statement = select(Permit).where(Permit.status == status).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    ).order_by(Permit.created_at.desc())
    return db.execute(statement).scalars().all()

def get_permits_by_permittee_id(db: Session, user_id: UUID) -> List[Permit]:
    statement = select(Permit).where(Permit.permittee_id == user_id).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    ).order_by(Permit.created_at.desc())
    return db.execute(statement).scalars().all()

# --- NEW: Fetch all permits for Admin/Safety roles ---
def get_all_permits(db: Session) -> List[Permit]:
    statement = select(Permit).options(
        selectinload(Permit.permittee).selectinload(User.role),
        selectinload(Permit.authorizer).selectinload(User.role),
        selectinload(Permit.approver).selectinload(User.role),
        selectinload(Permit.ppes),
        selectinload(Permit.attendees)
    ).order_by(Permit.created_at.desc())
    return db.execute(statement).scalars().all()

def update_permit(db: Session, permit: Permit) -> Permit:
    db.add(permit)
    db.commit()
    db.refresh(permit)
    return permit