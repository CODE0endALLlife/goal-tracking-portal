from app.utils.progress_calculator import calculate_progress
from datetime import date


def test_numeric_progress():
    assert calculate_progress("Numeric", 100, 80) == 80.0
    assert calculate_progress("Numeric", 100, 120) == 100.0  # capped
    assert calculate_progress("Numeric", 0, 50) == 0.0


def test_percentage_progress():
    assert calculate_progress("Percentage", 50, 25) == 50.0


def test_zerobased_progress():
    assert calculate_progress("ZeroBased", 0, 0) == 100.0
    assert calculate_progress("ZeroBased", 0, 5) == 0.0


def test_timeline_progress():
    assert calculate_progress("Timeline", 0, 0, date(2024, 6, 30), date(2024, 6, 25)) == 100.0
    assert calculate_progress("Timeline", 0, 0, date(2024, 6, 30), date(2024, 7, 10)) == 50.0
    assert calculate_progress("Timeline", 0, 0) == 0.0
