from sqlmodel import Session, select
from typing import List
from app.modules.machine.machine_models import Machine

def get_all_machines(db: Session) -> List[Machine]:
    """Retrieve all physical assets in the workshop."""
    statement = select(Machine)
    return db.execute(statement).scalars().all()

def get_machine_by_asset_id(db: Session, asset_id: str) -> Machine | None:
    statement = select(Machine).where(Machine.asset_id == asset_id)
    return db.execute(statement).scalar_one_or_none()