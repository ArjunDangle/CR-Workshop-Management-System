from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field
from enum import Enum

class NotificationType(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL" # Use this for Kill Switch alerts
    SUCCESS = "SUCCESS"

class Notification(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True) # Who gets the alert
    title: str
    message: str
    type: NotificationType = Field(default=NotificationType.INFO)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Optional: Link to source (e.g., clicking takes you to the Incident)
    link_url: Optional[str] = None 

class ActionLog(SQLModel, table=True):
    """
    Global Audit Trail for Safety Critical Actions
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    entity_name: str # e.g., "PERMIT", "INCIDENT", "CONTRACTOR"
    entity_id: UUID
    actor_id: Optional[UUID] = None # System (None) or User ID
    action: str # "SUSPENDED", "CREATED", "LOCKED"
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class FileAttachment(SQLModel, table=True):
    """
    Central storage for document metadata
    """
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    entity_name: str # "WORKER", "INCIDENT"
    entity_id: UUID
    file_name: str
    file_url: str
    uploaded_by_id: Optional[UUID] = Field(foreign_key="user.id")
    uploaded_at: datetime = Field(default_factory=datetime.now)