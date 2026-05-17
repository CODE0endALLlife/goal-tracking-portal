from datetime import date
from typing import Optional


def calculate_progress(unit_of_measurement: str, target: float, actual: float, deadline: Optional[date] = None, completion_date: Optional[date] = None) -> float:
    """
    Returns progress as a percentage (0.0 to 100.0).
    Numeric / Percentage: Higher is better → Achievement / Target * 100
    ZeroBased: If actual == 0 → 100%, else 0%
    Timeline: Completion before deadline → 100%, else proportional
    """
    if unit_of_measurement in ("Numeric", "Percentage"):
        if target == 0:
            return 0.0
        return min((actual / target) * 100, 100.0)

    elif unit_of_measurement == "ZeroBased":
        return 100.0 if actual == 0 else 0.0

    elif unit_of_measurement == "Timeline":
        if deadline is None or completion_date is None:
            return 0.0
        if completion_date <= deadline:
            return 100.0
        # Penalize for late completion
        days_late = (completion_date - deadline).days
        penalty = min(days_late * 5, 100)
        return max(0.0, 100.0 - penalty)

    return 0.0
