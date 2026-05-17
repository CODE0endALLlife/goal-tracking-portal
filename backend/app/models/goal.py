import enum
from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class GoalStatus(str, enum.Enum):
    Draft = "Draft"
    Submitted = "Submitted"
    Approved = "Approved"
    Rejected = "Rejected"
    Completed = "Completed"
    Archived = "Archived"


class UnitOfMeasurement(str, enum.Enum):
    Numeric = "Numeric"
    Percentage = "Percentage"
    Timeline = "Timeline"
    ZeroBased = "ZeroBased"


class ThrustArea(BaseModel):
    __tablename__ = "thrust_areas"

    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    goals = relationship("Goal", back_populates="thrust_area")


class Goal(BaseModel):
    __tablename__ = "goals"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    thrust_area_id = Column(UUID(as_uuid=True), ForeignKey("thrust_areas.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    unit_of_measurement = Column(Enum(UnitOfMeasurement), nullable=False)
    target = Column(Numeric(10, 2), nullable=False)
    weightage = Column(Numeric(5, 2), nullable=False)
    status = Column(Enum(GoalStatus), default=GoalStatus.Draft, nullable=False, index=True)
    is_locked = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="goals", foreign_keys=[user_id])
    thrust_area = relationship("ThrustArea", back_populates="goals")
    comments = relationship("GoalComment", back_populates="goal", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="goal", cascade="all, delete-orphan")
    shared_goals = relationship("SharedGoal", back_populates="goal", cascade="all, delete-orphan")


class GoalComment(BaseModel):
    __tablename__ = "goal_comments"

    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comment = Column(Text, nullable=False)

    goal = relationship("Goal", back_populates="comments")
    user = relationship("User")
