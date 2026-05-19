from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from passlib.context import CryptContext

from .config import settings
from .database import Base, engine, SessionLocal
from .models import User, Role, UserRole
from .models.goal import Goal, ThrustArea, GoalStatus, UnitOfMeasurement
from .models.check_in import CheckIn, QuarterlyCycle, CheckInStatus
from .api.v1 import auth_router, goal_router, check_in_router, admin_router, reporting_router, websocket_router

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


from sqlalchemy import text
from .models import User, Role, UserRole, Permission, RolePermission
from .models.goal import Goal, ThrustArea, GoalStatus, UnitOfMeasurement, GoalComment
from .models.check_in import CheckIn, QuarterlyCycle, CheckInStatus, CheckInComment
from .models.audit_log import AuditLog, AuditAction

def seed_database():
    """Create demo tables, permissions, roles, users, thrust areas, goals, cycles, and check-ins."""
    from datetime import date
    import uuid
    db = SessionLocal()
    try:
        # --- Create SQLite helper table for manager_employee ---
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS manager_employee (
                manager_id VARCHAR(36) NOT NULL,
                employee_id VARCHAR(36) NOT NULL,
                PRIMARY KEY (manager_id, employee_id)
            );
        """))
        db.commit()

        # --- Permissions ---
        permissions_data = [
            ("goal:read", "Read own goals"),
            ("goal:create", "Create goals"),
            ("goal:edit", "Edit own goals"),
            ("goal:submit", "Submit goals for approval"),
            ("goal:approve", "Approve or reject goals"),
            ("goal:read_team", "Read team goals"),
            ("goal:unlock", "Unlock goals"),
            ("checkin:read", "Read check-ins"),
            ("checkin:create", "Create check-ins"),
            ("checkin:edit", "Edit check-ins"),
            ("checkin:comment", "Add check-in comments"),
            ("user:read", "Read user list"),
            ("user:create", "Create users"),
            ("user:edit", "Edit users"),
            ("audit:read", "Read audit logs"),
            ("report:read", "Read reports")
        ]
        perm_map = {}
        for p_name, p_desc in permissions_data:
            p_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"perm:{p_name}"))
            perm = db.query(Permission).filter(Permission.name == p_name).first()
            if not perm:
                perm = Permission(id=p_id, name=p_name, description=p_desc)
                db.add(perm)
                db.flush()
            perm_map[p_name] = perm
        db.commit()

        # --- Roles ---
        role_map = {}
        for role_name in ["Admin", "Manager", "Employee", "HR"]:
            r_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"role:{role_name}"))
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(id=r_id, name=role_name, description=f"{role_name} role")
                db.add(role)
                db.flush()
            role_map[role_name] = role
        db.commit()

        # --- Assign Permissions to Roles ---
        role_perms = {
            "Employee": [
                "goal:read", "goal:create", "goal:edit", "goal:submit",
                "checkin:read", "checkin:create", "checkin:edit"
            ],
            "Manager": [
                "goal:read", "goal:create", "goal:edit", "goal:submit", "goal:approve", "goal:read_team",
                "checkin:read", "checkin:create", "checkin:edit", "checkin:comment", "report:read"
            ],
            "Admin": [
                "goal:read", "goal:create", "goal:edit", "goal:submit", "goal:approve", "goal:read_team",
                "goal:unlock", "checkin:read", "checkin:create", "checkin:edit", "checkin:comment",
                "user:read", "user:create", "user:edit", "audit:read", "report:read"
            ],
            "HR": [
                "goal:read", "goal:create", "goal:edit", "goal:submit", "goal:approve", "goal:read_team",
                "goal:unlock", "checkin:read", "checkin:create", "checkin:edit", "checkin:comment",
                "user:read", "user:create", "user:edit", "audit:read", "report:read"
            ]
        }
        for r_name, p_list in role_perms.items():
            role_obj = role_map[r_name]
            for p_name in p_list:
                perm_obj = perm_map[p_name]
                rp = db.query(RolePermission).filter(
                    RolePermission.role_id == role_obj.id,
                    RolePermission.permission_id == perm_obj.id
                ).first()
                if not rp:
                    rp_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"rp:{role_obj.id}:{perm_obj.id}"))
                    db.add(RolePermission(id=rp_id, role_id=role_obj.id, permission_id=perm_obj.id))
        db.commit()

        # --- Users ---
        users_data = [
            {"email": "admin@example.com", "password": "admin123", "first": "Admin", "last": "User", "roles": ["Admin", "Employee"]},
            {"email": "manager@example.com", "password": "demo123", "first": "Anita", "last": "Kapoor", "roles": ["Manager", "Employee"]},
            {"email": "employee@example.com", "password": "demo123", "first": "Priya", "last": "Sharma", "roles": ["Employee"]},
            {"email": "employee2@example.com", "password": "demo123", "first": "Rahul", "last": "Verma", "roles": ["Employee"]},
        ]
        user_map = {}
        for ud in users_data:
            u_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user:{ud['email']}"))
            user = db.query(User).filter(User.email == ud["email"]).first()
            if not user:
                user = User(
                    id=u_id,
                    email=ud["email"],
                    password_hash=pwd_context.hash(ud["password"]),
                    first_name=ud["first"],
                    last_name=ud["last"],
                    is_active=True,
                )
                db.add(user)
                db.flush()
                for rn in ud["roles"]:
                    ur_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"ur:{user.id}:{role_map[rn].id}"))
                    db.add(UserRole(id=ur_id, user_id=user.id, role_id=role_map[rn].id))
            user_map[ud["email"]] = user
        db.commit()

        # --- Manager-Employee Relationships ---
        for emp_email in ["employee@example.com", "employee2@example.com"]:
            mgr_id = user_map["manager@example.com"].id
            emp_id = user_map[emp_email].id
            res = db.execute(text("SELECT 1 FROM manager_employee WHERE manager_id = :mgr AND employee_id = :emp"), {"mgr": mgr_id, "emp": emp_id}).first()
            if not res:
                db.execute(text("INSERT INTO manager_employee (manager_id, employee_id) VALUES (:mgr, :emp)"), {"mgr": mgr_id, "emp": emp_id})
        db.commit()

        # --- Thrust Areas ---
        ta_names = [
            ("Revenue Growth", "Goals related to revenue and sales growth"),
            ("Customer Experience", "Goals focused on customer satisfaction"),
            ("Customer Satisfaction", "Improve NPS and reduce customer churn"),
            ("Operational Excellence", "Goals for improving operational efficiency"),
            ("People & Culture", "Goals for team development and culture"),
            ("Innovation & Technology", "Goals for innovation and digital transformation"),
            ("Compliance & Risk", "Goals for regulatory compliance and risk management")
        ]
        ta_map = {}
        for name, desc in ta_names:
            ta_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"ta:{name}"))
            ta = db.query(ThrustArea).filter(ThrustArea.name == name).first()
            if not ta:
                ta = ThrustArea(id=ta_id, name=name, description=desc, is_active=True)
                db.add(ta)
                db.flush()
            ta_map[name] = ta
        db.commit()

        # --- Quarterly Cycle ---
        cycle = db.query(QuarterlyCycle).filter(QuarterlyCycle.name == "Q1 2026").first()
        c_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "cycle:Q1 2026"))
        if not cycle:
            cycle = QuarterlyCycle(
                id=c_id,
                name="Q1 2026",
                start_date=date(2026, 4, 1),
                end_date=date(2026, 6, 30),
                goal_setting_start=date(2026, 4, 1),
                goal_setting_end=date(2026, 4, 30),
                is_active=True,
            )
            db.add(cycle)
            db.flush()
            db.commit()

        # --- Goals for Priya (employee@example.com) ---
        emp1 = user_map["employee@example.com"]
        if db.query(Goal).filter(Goal.user_id == emp1.id).count() == 0:
            goals_data = [
                {"title": "Achieve Q4 Regional Sales Target", "ta": "Revenue Growth", "uom": UnitOfMeasurement.Numeric, "target": 1000000, "weight": 30, "status": GoalStatus.Approved, "locked": True},
                {"title": "Improve Customer NPS", "ta": "Customer Experience", "uom": UnitOfMeasurement.Percentage, "target": 90, "weight": 25, "status": GoalStatus.Approved, "locked": True},
                {"title": "Automate Invoice Processing", "ta": "Operational Excellence", "uom": UnitOfMeasurement.Timeline, "target": 100, "weight": 25, "status": GoalStatus.Approved, "locked": True},
                {"title": "Zero Safety Incidents", "ta": "Compliance & Risk", "uom": UnitOfMeasurement.ZeroBased, "target": 0, "weight": 20, "status": GoalStatus.Approved, "locked": True},
            ]
            emp1_goals = []
            for gd in goals_data:
                g_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"goal:{emp1.email}:{gd['title']}"))
                goal = Goal(
                    id=g_id,
                    user_id=emp1.id,
                    thrust_area_id=ta_map[gd["ta"]].id,
                    title=gd["title"],
                    description=gd["title"] + " - Demo standard description.",
                    unit_of_measurement=gd["uom"],
                    target=gd["target"],
                    weightage=gd["weight"],
                    status=gd["status"],
                    is_locked=gd["locked"],
                )
                db.add(goal)
                db.flush()
                emp1_goals.append(goal)

            # Check-ins for Priya
            checkin_data = [
                {"goal_idx": 0, "actual": 720000, "status": CheckInStatus.OnTrack, "comment": "Pipeline strong; 72% achieved."},
                {"goal_idx": 1, "actual": 86, "status": CheckInStatus.OnTrack, "comment": "NPS improved after support revamp."},
                {"goal_idx": 2, "actual": 100, "status": CheckInStatus.Completed, "comment": "RPA deployed ahead of schedule."},
                {"goal_idx": 3, "actual": 0, "status": CheckInStatus.Completed, "comment": "Zero incidents maintained."}
            ]
            for cd in checkin_data:
                g_id = emp1_goals[cd["goal_idx"]].id
                ci_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"checkin:{g_id}:{cycle.id}"))
                ci = CheckIn(
                    id=ci_id,
                    goal_id=g_id,
                    user_id=emp1.id,
                    quarterly_cycle_id=cycle.id,
                    actual_value=cd["actual"],
                    status=cd["status"],
                    comments=cd["comment"],
                )
                db.add(ci)
                db.flush()

                # Add manager comments to check-in 0
                if cd["goal_idx"] == 0:
                    cic_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"cic:{ci.id}"))
                    cic = CheckInComment(
                        id=cic_id,
                        check_in_id=ci.id,
                        user_id=user_map["manager@example.com"].id,
                        comment="Great progress on revenue. Focus on closing enterprise deals in March."
                    )
                    db.add(cic)

            # Goal comment
            gc_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"gc:{emp1_goals[0].id}"))
            gc = GoalComment(
                id=gc_id,
                goal_id=emp1_goals[0].id,
                user_id=user_map["manager@example.com"].id,
                comment="Targets aligned with regional plan. Approved with 30% weightage."
            )
            db.add(gc)
            db.commit()

        # --- Goals for Rahul (employee2@example.com) ---
        emp2 = user_map["employee2@example.com"]
        if db.query(Goal).filter(Goal.user_id == emp2.id).count() == 0:
            goals_data2 = [
                {"title": "Launch Mobile App v2", "ta": "Innovation & Technology", "uom": UnitOfMeasurement.Numeric, "target": 1, "weight": 40, "status": GoalStatus.Submitted, "locked": False},
                {"title": "Reduce Customer Churn", "ta": "Customer Experience", "uom": UnitOfMeasurement.Percentage, "target": 5, "weight": 30, "status": GoalStatus.Draft, "locked": False},
                {"title": "Team Engagement Score", "ta": "People & Culture", "uom": UnitOfMeasurement.Percentage, "target": 85, "weight": 30, "status": GoalStatus.Approved, "locked": True},
            ]
            emp2_goals = []
            for gd in goals_data2:
                g_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"goal:{emp2.email}:{gd['title']}"))
                goal = Goal(
                    id=g_id,
                    user_id=emp2.id,
                    thrust_area_id=ta_map[gd["ta"]].id,
                    title=gd["title"],
                    description=gd["title"] + " - Demo description.",
                    unit_of_measurement=gd["uom"],
                    target=gd["target"],
                    weightage=gd["weight"],
                    status=gd["status"],
                    is_locked=gd["locked"],
                )
                db.add(goal)
                db.flush()
                emp2_goals.append(goal)

            # Check-in for Rahul
            g2_id = emp2_goals[2].id
            ci2_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"checkin:{g2_id}:{cycle.id}"))
            ci2 = CheckIn(
                id=ci2_id,
                goal_id=g2_id,
                user_id=emp2.id,
                quarterly_cycle_id=cycle.id,
                actual_value=78,
                status=CheckInStatus.OnTrack,
                comments="Survey scheduled for next week."
            )
            db.add(ci2)
            db.commit()

        # --- Goals for Anita (manager@example.com) ---
        mgr = user_map["manager@example.com"]
        if db.query(Goal).filter(Goal.user_id == mgr.id).count() == 0:
            goals_mgr = [
                {"title": "Grow team productivity by 20%", "ta": "People & Culture", "uom": UnitOfMeasurement.Percentage, "target": 20, "weight": 40, "status": GoalStatus.Approved, "locked": True},
                {"title": "Deliver Q1 project milestones on time", "ta": "Operational Excellence", "uom": UnitOfMeasurement.Numeric, "target": 5, "weight": 35, "status": GoalStatus.Approved, "locked": True},
                {"title": "Implement CI/CD pipeline improvements", "ta": "Innovation & Technology", "uom": UnitOfMeasurement.Numeric, "target": 3, "weight": 25, "status": GoalStatus.Approved, "locked": True},
            ]
            mgr_goals = []
            for gd in goals_mgr:
                g_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"goal:{mgr.email}:{gd['title']}"))
                goal = Goal(
                    id=g_id,
                    user_id=mgr.id,
                    thrust_area_id=ta_map[gd["ta"]].id,
                    title=gd["title"],
                    description=gd["title"] + " - Manager description.",
                    unit_of_measurement=gd["uom"],
                    target=gd["target"],
                    weightage=gd["weight"],
                    status=gd["status"],
                    is_locked=gd["locked"],
                )
                db.add(goal)
                db.flush()
                mgr_goals.append(goal)

            # Check-ins for Anita
            mgr_checkins = [
                {"goal_idx": 0, "actual": 14, "status": CheckInStatus.OnTrack, "comment": "Hired 2 new seniors."},
                {"goal_idx": 1, "actual": 3, "status": CheckInStatus.OnTrack, "comment": "Milestones 1-3 achieved on schedule."},
                {"goal_idx": 2, "actual": 1, "status": CheckInStatus.NotStarted, "comment": "Planning phase completed."}
            ]
            for cd in mgr_checkins:
                g_id = mgr_goals[cd["goal_idx"]].id
                ci_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"checkin:{g_id}:{cycle.id}"))
                ci = CheckIn(
                    id=ci_id,
                    goal_id=g_id,
                    user_id=mgr.id,
                    quarterly_cycle_id=cycle.id,
                    actual_value=cd["actual"],
                    status=cd["status"],
                    comments=cd["comment"],
                )
                db.add(ci)

            db.commit()

    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"Seed error: {e}")
    finally:
        db.close()


seed_database()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Goal Tracking Portal",
    description="Enterprise Goal Setting & Performance Tracking System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(goal_router.router, prefix="/api/v1")
app.include_router(check_in_router.router, prefix="/api/v1")
app.include_router(admin_router.router, prefix="/api/v1")
app.include_router(reporting_router.router, prefix="/api/v1")
app.include_router(websocket_router.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Goal Tracking Portal API", "docs": "/docs"}
