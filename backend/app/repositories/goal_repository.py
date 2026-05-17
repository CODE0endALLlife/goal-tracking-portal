from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models import Goal, GoalStatus


class GoalRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, goal_id: UUID) -> Optional[Goal]:
        return self.db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.deleted_at.is_(None)
        ).first()

    def find_by_user(self, user_id: UUID, status: Optional[GoalStatus] = None) -> List[Goal]:
        query = self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None)
        )
        if status:
            query = query.filter(Goal.status == status)
        return query.all()

    def find_active_by_user(self, user_id: UUID) -> List[Goal]:
        return self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
            Goal.status != GoalStatus.Archived
        ).all()

    def count_by_user(self, user_id: UUID) -> int:
        return self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
            Goal.status != GoalStatus.Archived
        ).count()

    def save(self, goal: Goal) -> Goal:
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def delete(self, goal: Goal):
        from datetime import datetime, timezone
        goal.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
