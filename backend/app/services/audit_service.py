from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from ..models import AuditLog, AuditAction


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        user_id: UUID,
        action: AuditAction,
        table_name: str,
        record_id: UUID,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log_entry)
        self.db.commit()
        return log_entry
