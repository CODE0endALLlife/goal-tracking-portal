from sqlalchemy import Column, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class SharedGoal(BaseModel):
    __tablename__ = "shared_goals"

    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weightage = Column(Numeric(5, 2), nullable=False)

    __table_args__ = (
        UniqueConstraint("goal_id", "user_id", name="uq_shared_goal_user"),
    )

    goal = relationship("Goal", back_populates="shared_goals")
    user = relationship("User")
