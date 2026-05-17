from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Goal, User, ThrustArea, SharedGoal, GoalComment, GoalStatus, AuditAction
from ..schemas import GoalCreate, GoalUpdate, GoalApproval, GoalReject
from ..utils.validators import validate_goal_weightage
from .audit_service import AuditService


class GoalService:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    def get_goals(self, user_id: UUID, status: Optional[str] = None) -> List[Goal]:
        query = self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None)
        )
        if status:
            query = query.filter(Goal.status == status)
        return query.all()

    def get_goal(self, goal_id: UUID, user_id: Optional[UUID] = None) -> Goal:
        query = self.db.query(Goal).filter(Goal.id == goal_id, Goal.deleted_at.is_(None))
        if user_id:
            query = query.filter(Goal.user_id == user_id)
        goal = query.first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal

    def create_goal(self, user_id: UUID, goal_data: GoalCreate) -> Goal:
        existing_goals = self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
            Goal.status != GoalStatus.Archived
        ).all()

        # Max 8 goals
        if len(existing_goals) >= 8:
            raise HTTPException(status_code=400, detail="Maximum 8 goals per employee")

        # Validate total weightage
        validate_goal_weightage(existing_goals, goal_data.weightage)

        goal = Goal(
            user_id=user_id,
            thrust_area_id=goal_data.thrust_area_id,
            title=goal_data.title,
            description=goal_data.description,
            unit_of_measurement=goal_data.unit_of_measurement,
            target=goal_data.target,
            weightage=goal_data.weightage,
            status=GoalStatus.Draft
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=user_id,
            action=AuditAction.Create,
            table_name="goals",
            record_id=goal.id,
            new_value=goal_data.model_dump(mode="json")
        )
        return goal

    def update_goal(self, user_id: UUID, goal_id: UUID, goal_data: GoalUpdate) -> Goal:
        goal = self.get_goal(goal_id, user_id)

        if goal.is_locked:
            raise HTTPException(status_code=403, detail="Goal is locked. Contact admin to unlock.")

        if goal.status not in [GoalStatus.Draft, GoalStatus.Rejected]:
            raise HTTPException(status_code=400, detail="Only draft or rejected goals can be edited")

        old_value = {"title": goal.title, "target": str(goal.target), "weightage": str(goal.weightage)}

        if goal_data.weightage is not None:
            self._validate_weightage_replacement(user_id, goal_data.weightage, exclude_goal_id=goal.id)

        for field, value in goal_data.model_dump(exclude_none=True).items():
            setattr(goal, field, value)

        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=user_id,
            action=AuditAction.Update,
            table_name="goals",
            record_id=goal.id,
            old_value=old_value,
            new_value=goal_data.model_dump(exclude_none=True, mode="json")
        )
        return goal

    def submit_for_approval(self, user_id: UUID, goal_id: UUID) -> Goal:
        goal = self.get_goal(goal_id, user_id)

        # Validate total weightage = 100% before submit
        all_goals = self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
            Goal.status != GoalStatus.Archived
        ).all()
        total = sum(float(g.weightage) for g in all_goals)
        if abs(total - 100.0) > 0.01:
            raise HTTPException(status_code=400, detail=f"Total weightage must equal 100%. Current: {total}%")

        if goal.status != GoalStatus.Draft:
            raise HTTPException(status_code=400, detail="Only draft goals can be submitted")

        goal.status = GoalStatus.Submitted
        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=user_id,
            action=AuditAction.Update,
            table_name="goals",
            record_id=goal.id,
            old_value={"status": "Draft"},
            new_value={"status": "Submitted"}
        )
        return goal

    def approve_goal(self, manager_id: UUID, goal_id: UUID, approval_data: GoalApproval) -> Goal:
        goal = self.db.query(Goal).filter(Goal.id == goal_id, Goal.deleted_at.is_(None)).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        if not self._is_manager_of(manager_id, goal.user_id):
            raise HTTPException(status_code=403, detail="Not authorized to approve this goal")

        if goal.status != GoalStatus.Submitted:
            raise HTTPException(status_code=400, detail="Goal is not in submitted state")

        old_value = {"status": goal.status, "target": str(goal.target), "weightage": str(goal.weightage)}

        if approval_data.target is not None:
            goal.target = approval_data.target
        if approval_data.weightage is not None:
            self._validate_weightage_replacement(goal.user_id, approval_data.weightage, exclude_goal_id=goal.id)
            goal.weightage = approval_data.weightage

        goal.status = GoalStatus.Approved
        goal.is_locked = True
        self.db.flush()

        if approval_data.comment:
            comment = GoalComment(goal_id=goal_id, user_id=manager_id, comment=approval_data.comment)
            self.db.add(comment)

        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=manager_id,
            action=AuditAction.Approve,
            table_name="goals",
            record_id=goal.id,
            old_value=old_value,
            new_value={"status": "Approved", "is_locked": True}
        )
        return goal

    def reject_goal(self, manager_id: UUID, goal_id: UUID, reject_data: GoalReject) -> Goal:
        goal = self.db.query(Goal).filter(Goal.id == goal_id, Goal.deleted_at.is_(None)).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        if not self._is_manager_of(manager_id, goal.user_id):
            raise HTTPException(status_code=403, detail="Not authorized")

        if goal.status != GoalStatus.Submitted:
            raise HTTPException(status_code=400, detail="Goal is not in submitted state")

        goal.status = GoalStatus.Rejected
        self.db.flush()

        comment = GoalComment(goal_id=goal_id, user_id=manager_id, comment=reject_data.comment)
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=manager_id,
            action=AuditAction.Reject,
            table_name="goals",
            record_id=goal.id,
            old_value={"status": "Submitted"},
            new_value={"status": "Rejected"}
        )
        return goal

    def unlock_goal(self, admin_id: UUID, goal_id: UUID) -> Goal:
        goal = self.db.query(Goal).filter(Goal.id == goal_id, Goal.deleted_at.is_(None)).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        goal.is_locked = False
        self.db.commit()
        self.db.refresh(goal)

        self.audit.log(
            user_id=admin_id,
            action=AuditAction.Unlock,
            table_name="goals",
            record_id=goal.id,
            old_value={"is_locked": True},
            new_value={"is_locked": False}
        )
        return goal

    def delete_goal(self, user_id: UUID, goal_id: UUID):
        from datetime import datetime, timezone
        goal = self.get_goal(goal_id, user_id)
        if goal.is_locked:
            raise HTTPException(status_code=403, detail="Cannot delete a locked goal")
        goal.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    def get_team_goals(self, manager_id: UUID) -> List[Goal]:
        from ..models.user import UserRole, Role
        # Get employees managed by this manager
        from sqlalchemy import text
        result = self.db.execute(
            text("SELECT employee_id FROM manager_employee WHERE manager_id = :mgr_id"),
            {"mgr_id": str(manager_id)}
        ).fetchall()
        employee_ids = [row[0] for row in result]
        if not employee_ids:
            return []
        return self.db.query(Goal).filter(
            Goal.user_id.in_(employee_ids),
            Goal.deleted_at.is_(None)
        ).all()

    def _is_manager_of(self, manager_id: UUID, employee_id: UUID) -> bool:
        from sqlalchemy import text
        result = self.db.execute(
            text("SELECT 1 FROM manager_employee WHERE manager_id = :mgr AND employee_id = :emp"),
            {"mgr": str(manager_id), "emp": str(employee_id)}
        ).first()
        return result is not None

    def _validate_weightage_replacement(
        self,
        user_id: UUID,
        proposed_weightage: float,
        exclude_goal_id: Optional[UUID] = None
    ) -> None:
        if proposed_weightage < 10:
            raise HTTPException(status_code=400, detail="Minimum weightage per goal is 10%")
        if proposed_weightage > 100:
            raise HTTPException(status_code=400, detail="Maximum weightage per goal is 100%")

        query = self.db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at.is_(None),
            Goal.status != GoalStatus.Archived
        )
        if exclude_goal_id:
            query = query.filter(Goal.id != exclude_goal_id)

        current_total = sum(float(g.weightage) for g in query.all())
        new_total = current_total + float(proposed_weightage)
        if new_total > 100:
            raise HTTPException(
                status_code=400,
                detail=f"Total weightage cannot exceed 100%. Other goals: {current_total}%, Proposed: {proposed_weightage}%"
            )
