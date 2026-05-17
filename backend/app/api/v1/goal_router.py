from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...database import get_db
from ...dependencies import get_current_active_user, check_permission
from ...models import User
from ...schemas import (
    GoalCreate, GoalUpdate, GoalApproval, GoalReject, GoalResponse,
    GoalCommentResponse, ThrustAreaResponse, SharedGoalCreate, SharedGoalResponse, MessageResponse
)
from ...services.goal_service import GoalService

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("/thrust-areas", response_model=List[ThrustAreaResponse])
def get_thrust_areas(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    from ...models import ThrustArea
    return db.query(ThrustArea).filter(ThrustArea.is_active == True).all()


@router.get("", response_model=List[GoalResponse])
def get_goals(
    status: Optional[str] = Query(None),
    current_user: User = Depends(check_permission("goal:read")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.get_goals(current_user.id, status)


@router.post("", response_model=GoalResponse, status_code=201)
def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(check_permission("goal:create")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.create_goal(current_user.id, goal_data)


@router.get("/team", response_model=List[GoalResponse])
def get_team_goals(
    current_user: User = Depends(check_permission("goal:read_team")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.get_team_goals(current_user.id)


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: UUID,
    current_user: User = Depends(check_permission("goal:read")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.get_goal(goal_id)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID,
    goal_data: GoalUpdate,
    current_user: User = Depends(check_permission("goal:edit")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.update_goal(current_user.id, goal_id, goal_data)


@router.post("/{goal_id}/submit", response_model=GoalResponse)
def submit_goal(
    goal_id: UUID,
    current_user: User = Depends(check_permission("goal:submit")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.submit_for_approval(current_user.id, goal_id)


@router.post("/{goal_id}/approve", response_model=GoalResponse)
def approve_goal(
    goal_id: UUID,
    approval_data: GoalApproval,
    current_user: User = Depends(check_permission("goal:approve")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.approve_goal(current_user.id, goal_id, approval_data)


@router.post("/{goal_id}/reject", response_model=GoalResponse)
def reject_goal(
    goal_id: UUID,
    reject_data: GoalReject,
    current_user: User = Depends(check_permission("goal:approve")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.reject_goal(current_user.id, goal_id, reject_data)


@router.post("/{goal_id}/unlock", response_model=GoalResponse)
def unlock_goal(
    goal_id: UUID,
    current_user: User = Depends(check_permission("goal:unlock")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    return service.unlock_goal(current_user.id, goal_id)


@router.delete("/{goal_id}", response_model=MessageResponse)
def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(check_permission("goal:edit")),
    db: Session = Depends(get_db)
):
    service = GoalService(db)
    service.delete_goal(current_user.id, goal_id)
    return {"message": "Goal deleted successfully"}
