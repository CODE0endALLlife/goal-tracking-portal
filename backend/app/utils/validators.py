from typing import List
from fastapi import HTTPException
from ..models import Goal


def validate_goal_weightage(existing_goals: List[Goal], new_weightage: float):
    """Validates that adding new_weightage won't exceed 100% total."""
    current_total = sum(float(g.weightage) for g in existing_goals)
    if new_weightage < 10:
        raise HTTPException(status_code=400, detail="Minimum weightage per goal is 10%")
    if new_weightage > 100:
        raise HTTPException(status_code=400, detail="Maximum weightage per goal is 100%")
    if current_total + new_weightage > 100:
        raise HTTPException(
            status_code=400,
            detail=f"Total weightage cannot exceed 100%. Current total: {current_total}%, Attempting to add: {new_weightage}%"
        )
