from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...database import get_db
from ...dependencies import get_current_active_user, check_permission
from ...models import User
from ...schemas import (
    CheckInCreate, CheckInUpdate, CheckInResponse,
    QuarterlyCycleCreate, QuarterlyCycleResponse, ManagerCommentCreate, MessageResponse
)
from ...services.check_in_service import CheckInService

router = APIRouter(prefix="/check-ins", tags=["Check-Ins"])


@router.get("/cycles", response_model=List[QuarterlyCycleResponse])
def get_cycles(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    from ...models import QuarterlyCycle
    return db.query(QuarterlyCycle).order_by(QuarterlyCycle.start_date.desc()).all()


@router.get("", response_model=List[CheckInResponse])
def get_check_ins(
    goal_id: Optional[UUID] = Query(None),
    current_user: User = Depends(check_permission("checkin:read")),
    db: Session = Depends(get_db)
):
    service = CheckInService(db)
    return service.get_check_ins(current_user.id, goal_id)


@router.post("", response_model=CheckInResponse, status_code=201)
def create_check_in(
    data: CheckInCreate,
    current_user: User = Depends(check_permission("checkin:create")),
    db: Session = Depends(get_db)
):
    service = CheckInService(db)
    return service.create_check_in(current_user.id, data)


@router.put("/{check_in_id}", response_model=CheckInResponse)
def update_check_in(
    check_in_id: UUID,
    data: CheckInUpdate,
    current_user: User = Depends(check_permission("checkin:edit")),
    db: Session = Depends(get_db)
):
    service = CheckInService(db)
    return service.update_check_in(current_user.id, check_in_id, data)


@router.post("/{check_in_id}/comment", response_model=MessageResponse)
def add_manager_comment(
    check_in_id: UUID,
    data: ManagerCommentCreate,
    current_user: User = Depends(check_permission("checkin:comment")),
    db: Session = Depends(get_db)
):
    service = CheckInService(db)
    service.add_manager_comment(current_user.id, check_in_id, data)
    return {"message": "Comment added"}
