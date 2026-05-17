from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session

from ...database import get_db
from ...dependencies import get_current_active_user, check_permission
from ...models import User
from ...services.reporting_service import ReportingService

router = APIRouter(prefix="/reports", tags=["Reporting"])


@router.get("/goal-completion")
def get_goal_completion(
    current_user: User = Depends(check_permission("report:read")),
    db: Session = Depends(get_db)
):
    service = ReportingService(db)
    return service.get_goal_completion_data()


@router.get("/goal-completion/export")
def export_goal_completion_csv(
    current_user: User = Depends(check_permission("report:read")),
    db: Session = Depends(get_db)
):
    service = ReportingService(db)
    csv_bytes = service.export_csv()
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=goal_completion_report.csv"}
    )


@router.get("/team-analytics")
def get_team_analytics(
    current_user: User = Depends(check_permission("report:read")),
    db: Session = Depends(get_db)
):
    service = ReportingService(db)
    return service.get_team_analytics(current_user.id)
