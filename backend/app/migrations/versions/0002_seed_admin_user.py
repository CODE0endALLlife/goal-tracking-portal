"""Seed default admin user

Revision ID: 0002_seed_admin
Revises: 0001_initial
Create Date: 2026-05-17
"""
from alembic import op

revision = "0002_seed_admin"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

ADMIN_EMAIL = "admin@goaltracker.dev"
# Password: Admin123! (change after first login in production)
ADMIN_PASSWORD_HASH = "$2b$12$n4BXV3lanwFDpgDFRPgScu5eaeDF4yLGEUeSftUDkPk5Rklo1WaIe"


def upgrade() -> None:
    op.execute(
        f"""
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
        SELECT
            'a0000000-0000-4000-8000-000000000001',
            '{ADMIN_EMAIL}',
            '{ADMIN_PASSWORD_HASH}',
            'System',
            'Admin',
            true,
            now(),
            now()
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '{ADMIN_EMAIL}');
        """
    )
    op.execute(
        f"""
        UPDATE users
        SET email = '{ADMIN_EMAIL}',
            password_hash = '{ADMIN_PASSWORD_HASH}',
            first_name = 'System',
            last_name = 'Admin',
            is_active = true
        WHERE id = 'a0000000-0000-4000-8000-000000000001'
          AND email <> '{ADMIN_EMAIL}';
        """
    )
    op.execute(
        f"""
        INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, r.id, now(), now()
        FROM users u
        CROSS JOIN roles r
        WHERE u.email = '{ADMIN_EMAIL}'
          AND r.name IN ('Admin', 'Employee')
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = u.id AND ur.role_id = r.id
          );
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DELETE FROM user_roles
        WHERE user_id = (SELECT id FROM users WHERE email = '{ADMIN_EMAIL}');
        """
    )
    op.execute(f"DELETE FROM users WHERE email = '{ADMIN_EMAIL}';")
