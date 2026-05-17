import io
import csv
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from ..models import Goal, CheckIn, User, GoalStatus


class ReportingService:
    def __init__(self, db: Session):
        self.db = db

    def get_goal_completion_data(self, manager_id: Optional[UUID] = None) -> List[dict]:
        query = self.db.query(Goal, User).join(User, Goal.user_id == User.id).filter(
            Goal.deleted_at.is_(None)
        )
        if manager_id:
            from sqlalchemy import text
            result = self.db.execute(
                text("SELECT employee_id FROM manager_employee WHERE manager_id = :mgr"),
                {"mgr": str(manager_id)}
            ).fetchall()
            emp_ids = [r[0] for r in result]
            query = query.filter(Goal.user_id.in_(emp_ids))

        rows = []
        for goal, user in query.all():
            latest_checkin = self.db.query(CheckIn).filter(CheckIn.goal_id == goal.id).order_by(CheckIn.created_at.desc()).first()
            rows.append({
                "goal_id": str(goal.id),
                "employee_name": user.full_name,
                "employee_email": user.email,
                "goal_title": goal.title,
                "thrust_area": goal.thrust_area.name if goal.thrust_area else "",
                "target": float(goal.target),
                "weightage": float(goal.weightage),
                "status": goal.status,
                "actual_value": float(latest_checkin.actual_value) if latest_checkin and latest_checkin.actual_value else None,
                "check_in_status": latest_checkin.status if latest_checkin else None,
            })
        return rows

    def export_csv(self, manager_id: Optional[UUID] = None) -> bytes:
        data = self.get_goal_completion_data(manager_id)
        if not data:
            return b""

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue().encode("utf-8")

    def get_team_analytics(self, manager_id: UUID) -> dict:
        from sqlalchemy import text
        result = self.db.execute(
            text("SELECT employee_id FROM manager_employee WHERE manager_id = :mgr"),
            {"mgr": str(manager_id)}
        ).fetchall()
        emp_ids = [r[0] for r in result]

        goals = self.db.query(Goal).filter(
            Goal.user_id.in_(emp_ids),
            Goal.deleted_at.is_(None)
        ).all()

        status_dist = {}
        for g in goals:
            status_dist[g.status] = status_dist.get(g.status, 0) + 1

        return {
            "total_goals": len(goals),
            "status_distribution": status_dist,
            "team_size": len(emp_ids),
        }
