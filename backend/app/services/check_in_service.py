from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import CheckIn, CheckInComment, Goal, GoalStatus, AuditAction
from ..schemas import CheckInCreate, CheckInUpdate, ManagerCommentCreate
from ..utils.progress_calculator import calculate_progress
from .audit_service import AuditService


class CheckInService:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    def get_check_ins(self, user_id: UUID, goal_id: Optional[UUID] = None) -> List[CheckIn]:
        query = self.db.query(CheckIn).filter(CheckIn.user_id == user_id)
        if goal_id:
            query = query.filter(CheckIn.goal_id == goal_id)
        return query.all()

    def create_check_in(self, user_id: UUID, data: CheckInCreate) -> CheckIn:
        goal = self.db.query(Goal).filter(Goal.id == data.goal_id, Goal.deleted_at.is_(None)).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        if goal.status != GoalStatus.Approved:
            raise HTTPException(status_code=400, detail="Check-ins only allowed for approved goals")

        existing = self.db.query(CheckIn).filter(
            CheckIn.goal_id == data.goal_id,
            CheckIn.quarterly_cycle_id == data.quarterly_cycle_id,
            CheckIn.user_id == user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Check-in already exists for this quarter")

        check_in = CheckIn(
            goal_id=data.goal_id,
            user_id=user_id,
            quarterly_cycle_id=data.quarterly_cycle_id,
            actual_value=data.actual_value,
            status=data.status,
            comments=data.comments
        )
        self.db.add(check_in)
        self.db.commit()
        self.db.refresh(check_in)

        self.audit.log(
            user_id=user_id,
            action=AuditAction.CheckIn,
            table_name="check_ins",
            record_id=check_in.id,
            new_value=data.model_dump(mode="json")
        )
        return check_in

    def update_check_in(self, user_id: UUID, check_in_id: UUID, data: CheckInUpdate) -> CheckIn:
        check_in = self.db.query(CheckIn).filter(
            CheckIn.id == check_in_id,
            CheckIn.user_id == user_id
        ).first()
        if not check_in:
            raise HTTPException(status_code=404, detail="Check-in not found")

        old_value = {"actual_value": str(check_in.actual_value), "status": check_in.status}

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(check_in, field, value)

        self.db.commit()
        self.db.refresh(check_in)

        self.audit.log(
            user_id=user_id,
            action=AuditAction.Update,
            table_name="check_ins",
            record_id=check_in.id,
            old_value=old_value,
            new_value=data.model_dump(exclude_none=True, mode="json")
        )
        return check_in

    def add_manager_comment(self, manager_id: UUID, check_in_id: UUID, data: ManagerCommentCreate) -> CheckInComment:
        check_in = self.db.query(CheckIn).filter(CheckIn.id == check_in_id).first()
        if not check_in:
            raise HTTPException(status_code=404, detail="Check-in not found")

        comment = CheckInComment(
            check_in_id=check_in_id,
            user_id=manager_id,
            comment=data.comment
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def get_progress(self, goal: Goal, check_in: CheckIn) -> float:
        if check_in.actual_value is None:
            return 0.0
        return calculate_progress(goal.unit_of_measurement, float(goal.target), float(check_in.actual_value))
