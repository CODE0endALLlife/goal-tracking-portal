import enum
from sqlalchemy import Column, String, Text, Numeric, ForeignKey, Date, Boolean, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class CheckInStatus(str, enum.Enum):
    NotStarted = "Not Started"
    OnTrack = "On Track"
    Completed = "Completed"


class QuarterlyCycle(BaseModel):
    __tablename__ = "quarterly_cycles"

    name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    goal_setting_start = Column(Date, nullable=False)
    goal_setting_end = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)

    check_ins = relationship("CheckIn", back_populates="quarterly_cycle")


class CheckIn(BaseModel):
    __tablename__ = "check_ins"

    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quarterly_cycle_id = Column(UUID(as_uuid=True), ForeignKey("quarterly_cycles.id"), nullable=False)
    actual_value = Column(Numeric(10, 2))
    status = Column(
        Enum(CheckInStatus, values_callable=lambda statuses: [status.value for status in statuses]),
        default=CheckInStatus.NotStarted,
    )
    comments = Column(Text)

    __table_args__ = (
        UniqueConstraint("goal_id", "quarterly_cycle_id", "user_id", name="uq_check_in_per_quarter"),
    )

    goal = relationship("Goal", back_populates="check_ins")
    user = relationship("User", back_populates="check_ins")
    quarterly_cycle = relationship("QuarterlyCycle", back_populates="check_ins")
    manager_comments = relationship("CheckInComment", back_populates="check_in", cascade="all, delete-orphan")


class CheckInComment(BaseModel):
    __tablename__ = "check_in_comments"

    check_in_id = Column(UUID(as_uuid=True), ForeignKey("check_ins.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comment = Column(Text, nullable=False)

    check_in = relationship("CheckIn", back_populates="manager_comments")
    user = relationship("User")
