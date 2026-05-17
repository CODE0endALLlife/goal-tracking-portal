"""Initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # Roles
    op.create_table(
        "roles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Permissions
    op.create_table(
        "permissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # User Roles
    op.create_table(
        "user_roles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("role_id", UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Role Permissions
    op.create_table(
        "role_permissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("role_id", UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE")),
        sa.Column("permission_id", UUID(as_uuid=True), sa.ForeignKey("permissions.id", ondelete="CASCADE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Thrust Areas
    op.create_table(
        "thrust_areas",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Goals
    op.create_table(
        "goals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("thrust_area_id", UUID(as_uuid=True), sa.ForeignKey("thrust_areas.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("unit_of_measurement", sa.String(50), nullable=False),
        sa.Column("target", sa.Numeric(10, 2), nullable=False),
        sa.Column("weightage", sa.Numeric(5, 2), nullable=False),
        sa.Column("status", sa.String(50), default="Draft", nullable=False),
        sa.Column("is_locked", sa.Boolean, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_goals_user_id", "goals", ["user_id"])
    op.create_index("ix_goals_status", "goals", ["status"])

    # Goal Comments
    op.create_table(
        "goal_comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("goal_id", UUID(as_uuid=True), sa.ForeignKey("goals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("comment", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Shared Goals
    op.create_table(
        "shared_goals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("goal_id", UUID(as_uuid=True), sa.ForeignKey("goals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("weightage", sa.Numeric(5, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("goal_id", "user_id", name="uq_shared_goal_user"),
    )

    # Quarterly Cycles
    op.create_table(
        "quarterly_cycles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("goal_setting_start", sa.Date, nullable=False),
        sa.Column("goal_setting_end", sa.Date, nullable=False),
        sa.Column("is_active", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Check-ins
    op.create_table(
        "check_ins",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("goal_id", UUID(as_uuid=True), sa.ForeignKey("goals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quarterly_cycle_id", UUID(as_uuid=True), sa.ForeignKey("quarterly_cycles.id"), nullable=False),
        sa.Column("actual_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("status", sa.String(50), default="Not Started"),
        sa.Column("comments", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("goal_id", "quarterly_cycle_id", "user_id", name="uq_check_in_per_quarter"),
    )
    op.create_index("ix_check_ins_goal_id", "check_ins", ["goal_id"])
    op.create_index("ix_check_ins_user_id", "check_ins", ["user_id"])

    # Check-in Comments
    op.create_table(
        "check_in_comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("check_in_id", UUID(as_uuid=True), sa.ForeignKey("check_ins.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("comment", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Audit Logs
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("table_name", sa.String(50), nullable=False),
        sa.Column("record_id", UUID(as_uuid=True), nullable=False),
        sa.Column("old_value", JSONB),
        sa.Column("new_value", JSONB),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_record_id", "audit_logs", ["record_id"])

    # Manager-Employee relationship
    op.create_table(
        "manager_employee",
        sa.Column("manager_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("employee_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    )

    # Seed default data
    op.execute("""
        INSERT INTO roles (id, name, description, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'Employee', 'Standard employee role', now(), now()),
            (gen_random_uuid(), 'Manager', 'Team manager role', now(), now()),
            (gen_random_uuid(), 'Admin', 'System administrator', now(), now()),
            (gen_random_uuid(), 'HR', 'HR personnel', now(), now());
    """)

    op.execute("""
        INSERT INTO permissions (id, name, description, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'goal:read', 'Read own goals', now(), now()),
            (gen_random_uuid(), 'goal:create', 'Create goals', now(), now()),
            (gen_random_uuid(), 'goal:edit', 'Edit own goals', now(), now()),
            (gen_random_uuid(), 'goal:submit', 'Submit goals for approval', now(), now()),
            (gen_random_uuid(), 'goal:approve', 'Approve or reject goals', now(), now()),
            (gen_random_uuid(), 'goal:read_team', 'Read team goals', now(), now()),
            (gen_random_uuid(), 'goal:unlock', 'Unlock goals', now(), now()),
            (gen_random_uuid(), 'checkin:read', 'Read check-ins', now(), now()),
            (gen_random_uuid(), 'checkin:create', 'Create check-ins', now(), now()),
            (gen_random_uuid(), 'checkin:edit', 'Edit check-ins', now(), now()),
            (gen_random_uuid(), 'checkin:comment', 'Add check-in comments', now(), now()),
            (gen_random_uuid(), 'user:read', 'Read user list', now(), now()),
            (gen_random_uuid(), 'user:create', 'Create users', now(), now()),
            (gen_random_uuid(), 'user:edit', 'Edit users', now(), now()),
            (gen_random_uuid(), 'audit:read', 'Read audit logs', now(), now()),
            (gen_random_uuid(), 'report:read', 'Read reports', now(), now());
    """)

    # Assign permissions to roles
    op.execute("""
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        SELECT gen_random_uuid(), r.id, p.id, now(), now()
        FROM roles r, permissions p
        WHERE
            (r.name = 'Employee' AND p.name IN ('goal:read','goal:create','goal:edit','goal:submit','checkin:read','checkin:create','checkin:edit'))
            OR (r.name = 'Manager' AND p.name IN ('goal:read','goal:create','goal:edit','goal:submit','goal:approve','goal:read_team','checkin:read','checkin:create','checkin:edit','checkin:comment','report:read'))
            OR (r.name IN ('Admin','HR') AND p.name IN ('goal:read','goal:create','goal:edit','goal:submit','goal:approve','goal:read_team','goal:unlock','checkin:read','checkin:create','checkin:edit','checkin:comment','user:read','user:create','user:edit','audit:read','report:read'));
    """)

    # Seed thrust areas
    op.execute("""
        INSERT INTO thrust_areas (id, name, description, is_active, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'Revenue Growth', 'Goals related to revenue and sales growth', true, now(), now()),
            (gen_random_uuid(), 'Customer Experience', 'Goals focused on customer satisfaction', true, now(), now()),
            (gen_random_uuid(), 'Operational Excellence', 'Goals for improving operational efficiency', true, now(), now()),
            (gen_random_uuid(), 'People & Culture', 'Goals for team development and culture', true, now(), now()),
            (gen_random_uuid(), 'Innovation & Technology', 'Goals for innovation and digital transformation', true, now(), now()),
            (gen_random_uuid(), 'Compliance & Risk', 'Goals for regulatory compliance and risk management', true, now(), now());
    """)

    # Seed quarterly cycles
    op.execute("""
        INSERT INTO quarterly_cycles (id, name, start_date, end_date, goal_setting_start, goal_setting_end, is_active, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'Q1 FY2024-25', '2024-07-01', '2024-09-30', '2024-05-01', '2024-06-30', false, now(), now()),
            (gen_random_uuid(), 'Q2 FY2024-25', '2024-10-01', '2024-12-31', '2024-05-01', '2024-06-30', false, now(), now()),
            (gen_random_uuid(), 'Q3 FY2024-25', '2025-01-01', '2025-03-31', '2024-05-01', '2024-06-30', false, now(), now()),
            (gen_random_uuid(), 'Q4 FY2024-25', '2025-03-01', '2025-04-30', '2024-05-01', '2024-06-30', true, now(), now());
    """)


def downgrade() -> None:
    op.drop_table("manager_employee")
    op.drop_table("audit_logs")
    op.drop_table("check_in_comments")
    op.drop_table("check_ins")
    op.drop_table("quarterly_cycles")
    op.drop_table("shared_goals")
    op.drop_table("goal_comments")
    op.drop_table("goals")
    op.drop_table("thrust_areas")
    op.drop_table("role_permissions")
    op.drop_table("user_roles")
    op.drop_table("permissions")
    op.drop_table("roles")
    op.drop_table("users")
