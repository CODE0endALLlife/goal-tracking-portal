from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
from ..models.goal import GoalStatus, UnitOfMeasurement


class GoalCreate(BaseModel):
    thrust_area_id: UUID
    title: str
    description: Optional[str] = None
    unit_of_measurement: UnitOfMeasurement
    target: float
    weightage: float

    @field_validator("weightage")
    @classmethod
    def validate_weightage(cls, v):
        if v < 10 or v > 100:
            raise ValueError("Weightage must be between 10% and 100%")
        return v

    @field_validator("target")
    @classmethod
    def validate_target(cls, v):
        if v < 0:
            raise ValueError("Target cannot be negative")
        return v


class GoalUpdate(BaseModel):
    thrust_area_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    unit_of_measurement: Optional[UnitOfMeasurement] = None
    target: Optional[float] = None
    weightage: Optional[float] = None

    @field_validator("target")
    @classmethod
    def validate_target(cls, v):
        if v is not None and v < 0:
            raise ValueError("Target cannot be negative")
        return v

    @field_validator("weightage")
    @classmethod
    def validate_weightage(cls, v):
        if v is not None and (v < 10 or v > 100):
            raise ValueError("Weightage must be between 10% and 100%")
        return v


class GoalApproval(BaseModel):
    target: Optional[float] = None
    weightage: Optional[float] = None
    comment: Optional[str] = None

    @field_validator("target")
    @classmethod
    def validate_target(cls, v):
        if v is not None and v < 0:
            raise ValueError("Target cannot be negative")
        return v

    @field_validator("weightage")
    @classmethod
    def validate_weightage(cls, v):
        if v is not None and (v < 10 or v > 100):
            raise ValueError("Weightage must be between 10% and 100%")
        return v


class GoalReject(BaseModel):
    comment: str


class GoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    thrust_area_id: UUID
    title: str
    description: Optional[str] = None
    unit_of_measurement: UnitOfMeasurement
    target: float
    weightage: float
    status: GoalStatus
    is_locked: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalCommentResponse(BaseModel):
    id: UUID
    goal_id: UUID
    user_id: Optional[UUID] = None
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class ThrustAreaResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class SharedGoalCreate(BaseModel):
    goal_id: UUID
    user_id: UUID
    weightage: float


class SharedGoalResponse(BaseModel):
    id: UUID
    goal_id: UUID
    user_id: UUID
    weightage: float

    class Config:
        from_attributes = True
