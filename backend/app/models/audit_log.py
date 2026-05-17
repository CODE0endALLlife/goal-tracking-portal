import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel


class AuditAction(str, enum.Enum):
    Create = "Create"
    Update = "Update"
    Delete = "Delete"
    Approve = "Approve"
    Reject = "Reject"
    Unlock = "Unlock"
    CheckIn = "CheckIn"


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(Enum(AuditAction), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    old_value = Column(JSONB().with_variant(JSON(), "sqlite"))
    new_value = Column(JSONB().with_variant(JSON(), "sqlite"))
    ip_address = Column(String(45))
    user_agent = Column(Text)

    user = relationship("User", back_populates="audit_logs")
