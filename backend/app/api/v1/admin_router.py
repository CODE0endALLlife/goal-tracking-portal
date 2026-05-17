from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...database import get_db
from ...dependencies import check_permission
from ...models import User, AuditLog, Role
from ...schemas import UserCreate, UserUpdate, UserResponse, UserWithRoles, MessageResponse
from ...services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserWithRoles])
def list_users(
    current_user: User = Depends(check_permission("user:read")),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.deleted_at.is_(None)).all()


@router.post("/users", response_model=UserWithRoles, status_code=201)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(check_permission("user:create")),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    return service.register(user_data)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(check_permission("user:edit")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in user_data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/roles/{role_name}", response_model=MessageResponse)
def assign_role(
    user_id: UUID,
    role_name: str,
    current_user: User = Depends(check_permission("user:edit")),
    db: Session = Depends(get_db)
):
    from ...models import UserRole
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Role not found")
    existing = db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role_id == role.id).first()
    if not existing:
        db.add(UserRole(user_id=user_id, role_id=role.id))
        db.commit()
    return {"message": f"Role '{role_name}' assigned to user"}


@router.get("/audit-logs")
def get_audit_logs(
    user_id: Optional[UUID] = Query(None),
    action: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(check_permission("audit:read")),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/manager-employee", response_model=MessageResponse)
def assign_manager(
    manager_id: UUID,
    employee_id: UUID,
    current_user: User = Depends(check_permission("user:edit")),
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    db.execute(
        text("INSERT INTO manager_employee (manager_id, employee_id) VALUES (:mgr, :emp) ON CONFLICT DO NOTHING"),
        {"mgr": str(manager_id), "emp": str(employee_id)}
    )
    db.commit()
    return {"message": "Manager-employee relationship created"}
