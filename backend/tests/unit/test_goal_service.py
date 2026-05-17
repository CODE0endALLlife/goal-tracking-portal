import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from uuid import uuid4

from app.services.goal_service import GoalService
from app.schemas import GoalCreate
from app.models import Goal, GoalStatus, UnitOfMeasurement


@pytest.fixture
def db_session():
    return MagicMock()


@pytest.fixture
def goal_service(db_session):
    return GoalService(db_session)


def test_create_goal_exceeds_max(goal_service, db_session):
    existing = [MagicMock(weightage=10) for _ in range(8)]
    db_session.query.return_value.filter.return_value.all.return_value = existing
    goal_data = GoalCreate(
        thrust_area_id=uuid4(),
        title="New Goal",
        unit_of_measurement=UnitOfMeasurement.Numeric,
        target=100,
        weightage=10,
    )
    with pytest.raises(HTTPException) as exc:
        goal_service.create_goal(uuid4(), goal_data)
    assert exc.value.status_code == 400
    assert "Maximum 8 goals" in exc.value.detail


def test_create_goal_weightage_overflow(goal_service, db_session):
    existing = [MagicMock(weightage=60)]
    db_session.query.return_value.filter.return_value.all.return_value = existing
    goal_data = GoalCreate(
        thrust_area_id=uuid4(),
        title="New Goal",
        unit_of_measurement=UnitOfMeasurement.Numeric,
        target=100,
        weightage=50,
    )
    with pytest.raises(HTTPException) as exc:
        goal_service.create_goal(uuid4(), goal_data)
    assert exc.value.status_code == 400
    assert "cannot exceed 100%" in exc.value.detail


def test_approve_goal_not_submitted(goal_service, db_session):
    goal = MagicMock()
    goal.status = GoalStatus.Draft
    db_session.query.return_value.filter.return_value.filter.return_value.first.return_value = goal
    with patch.object(goal_service, "_is_manager_of", return_value=True):
        from app.schemas import GoalApproval
        with pytest.raises(HTTPException) as exc:
            goal_service.approve_goal(uuid4(), uuid4(), GoalApproval())
        assert exc.value.status_code == 400
