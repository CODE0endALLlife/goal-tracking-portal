from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from ..models.check_in import CheckInStatus


class CheckInCreate(BaseModel):
    goal_id: UUID
    quarterly_cycle_id: UUID
    actual_value: Optional[float] = None
    status: CheckInStatus = CheckInStatus.NotStarted
    comments: Optional[str] = None


class CheckInUpdate(BaseModel):
    actual_value: Optional[float] = None
    status: Optional[CheckInStatus] = None
    comments: Optional[str] = None


class CheckInResponse(BaseModel):
    id: UUID
    goal_id: UUID
    user_id: UUID
    quarterly_cycle_id: UUID
    actual_value: Optional[float] = None
    status: CheckInStatus
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuarterlyCycleCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    goal_setting_start: date
    goal_setting_end: date
    is_active: bool = False


class QuarterlyCycleResponse(BaseModel):
    id: UUID
    name: str
    start_date: date
    end_date: date
    goal_setting_start: date
    goal_setting_end: date
    is_active: bool

    class Config:
        from_attributes = True


class ManagerCommentCreate(BaseModel):
    comment: str
