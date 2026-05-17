"""Seed demo data for hackathon showcase

Revision ID: 0003_demo_data
Revises: 0002_seed_admin
"""
from alembic import op

revision = "0003_demo_data"
down_revision = "0002_seed_admin"
branch_labels = None
depends_on = None

DEMO_HASH = "$2b$12$.4eTuMWrT9hS6zy6xP4lUeM6oppt6wcT5yrXPfqljgYXxny8zCq.e"  # Demo123!

EMPLOYEE_ID = "e0000000-0000-4000-8000-000000000002"
EMPLOYEE2_ID = "e0000000-0000-4000-8000-000000000003"
MANAGER_ID = "b0000000-0000-4000-8000-000000000001"

G1 = "c0000000-0000-4000-8000-000000000001"
G2 = "c0000000-0000-4000-8000-000000000002"
G3 = "c0000000-0000-4000-8000-000000000003"
G4 = "c0000000-0000-4000-8000-000000000004"
G5 = "c0000000-0000-4000-8000-000000000005"
G6 = "c0000000-0000-4000-8000-000000000006"
G7 = "c0000000-0000-4000-8000-000000000007"
SHARED_GOAL_ID = "c0000000-0000-4000-8000-000000000099"


def upgrade() -> None:
    # Demo users
    op.execute(
        f"""
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
        VALUES
            ('{EMPLOYEE_ID}', 'employee@goaltracker.dev', '{DEMO_HASH}', 'Priya', 'Sharma', true, now(), now()),
            ('{EMPLOYEE2_ID}', 'employee2@goaltracker.dev', '{DEMO_HASH}', 'Rahul', 'Verma', true, now(), now()),
            ('{MANAGER_ID}', 'manager@goaltracker.dev', '{DEMO_HASH}', 'Anita', 'Kapoor', true, now(), now())
        ON CONFLICT (email) DO NOTHING;
        """
    )

    # Roles
    op.execute(
        f"""
        INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, r.id, now(), now()
        FROM users u
        CROSS JOIN roles r
        WHERE (
            (u.email = 'employee@goaltracker.dev' AND r.name = 'Employee')
            OR (u.email = 'employee2@goaltracker.dev' AND r.name = 'Employee')
            OR (u.email = 'manager@goaltracker.dev' AND r.name IN ('Manager', 'Employee'))
          )
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
          );
        """
    )

    # Manager → team
    op.execute(
        f"""
        INSERT INTO manager_employee (manager_id, employee_id)
        VALUES ('{MANAGER_ID}', '{EMPLOYEE_ID}'), ('{MANAGER_ID}', '{EMPLOYEE2_ID}')
        ON CONFLICT DO NOTHING;
        """
    )

    # Goals — Priya (employee): 4 approved goals = 100% weightage, all UoM types
    op.execute(
        f"""
        INSERT INTO goals (id, user_id, thrust_area_id, title, description, unit_of_measurement, target, weightage, status, is_locked, created_at, updated_at)
        SELECT v.id, '{EMPLOYEE_ID}', ta.id, v.title, v.description, v.uom, v.target, v.weightage, v.status, v.is_locked, now(), now()
        FROM (VALUES
            ('{G1}'::uuid, 'Achieve Q4 Regional Sales Target', 'Achieve regional sales target for Q4', 'Revenue Growth', 'Numeric', 1000000, 30, 'Approved', true),
            ('{G2}'::uuid, 'Improve Customer NPS', 'Raise NPS from baseline through service improvements', 'Customer Experience', 'Percentage', 90, 25, 'Approved', true),
            ('{G3}'::uuid, 'Automate Invoice Processing', 'Deploy RPA for AP workflow by quarter end', 'Operational Excellence', 'Timeline', 100, 25, 'Approved', true),
            ('{G4}'::uuid, 'Zero Safety Incidents', 'Maintain zero recordable incidents', 'Compliance & Risk', 'ZeroBased', 0, 20, 'Approved', true)
        ) AS v(id, title, description, thrust_name, uom, target, weightage, status, is_locked)
        JOIN thrust_areas ta ON ta.name = v.thrust_name
        WHERE NOT EXISTS (SELECT 1 FROM goals g WHERE g.id = v.id);
        """
    )

    # Goals — Rahul (employee2): mixed statuses for manager approval demo
    op.execute(
        f"""
        INSERT INTO goals (id, user_id, thrust_area_id, title, description, unit_of_measurement, target, weightage, status, is_locked, created_at, updated_at)
        SELECT v.id, '{EMPLOYEE2_ID}', ta.id, v.title, v.description, v.uom, v.target, v.weightage, v.status, v.is_locked, now(), now()
        FROM (VALUES
            ('{G5}'::uuid, 'Launch Mobile App v2', 'Ship MVP with core features', 'Innovation & Technology', 'Numeric', 1, 40, 'Submitted', false),
            ('{G6}'::uuid, 'Reduce Customer Churn', 'Lower churn rate vs last quarter', 'Customer Experience', 'Percentage', 5, 30, 'Draft', false),
            ('{G7}'::uuid, 'Team Engagement Score', 'Achieve engagement survey target', 'People & Culture', 'Percentage', 85, 30, 'Approved', true)
        ) AS v(id, title, description, thrust_name, uom, target, weightage, status, is_locked)
        JOIN thrust_areas ta ON ta.name = v.thrust_name
        WHERE NOT EXISTS (SELECT 1 FROM goals g WHERE g.id = v.id);
        """
    )

    # Shared departmental KPI (manager-owned goal shared to Priya)
    op.execute(
        f"""
        INSERT INTO goals (id, user_id, thrust_area_id, title, description, unit_of_measurement, target, weightage, status, is_locked, created_at, updated_at)
        SELECT '{SHARED_GOAL_ID}', '{MANAGER_ID}', ta.id,
            'Enterprise cost reduction (Shared KPI)',
            'Department-wide cost savings initiative — recipients adjust weightage only',
            'Percentage', 15, 10, 'Approved', true, now(), now()
        FROM thrust_areas ta WHERE ta.name = 'Operational Excellence'
          AND NOT EXISTS (SELECT 1 FROM goals WHERE id = '{SHARED_GOAL_ID}');
        """
    )
    op.execute(
        f"""
        INSERT INTO shared_goals (id, goal_id, user_id, weightage, created_at, updated_at)
        SELECT gen_random_uuid(), '{SHARED_GOAL_ID}', '{EMPLOYEE_ID}', 10, now(), now()
        WHERE NOT EXISTS (
            SELECT 1 FROM shared_goals WHERE goal_id = '{SHARED_GOAL_ID}' AND user_id = '{EMPLOYEE_ID}'
        );
        """
    )

    # Q4 check-ins for Priya's approved goals
    op.execute(
        f"""
        INSERT INTO check_ins (id, goal_id, user_id, quarterly_cycle_id, actual_value, status, comments, created_at, updated_at)
        SELECT gen_random_uuid(), v.goal_id, '{EMPLOYEE_ID}', qc.id, v.actual, v.status, v.comments, now(), now()
        FROM quarterly_cycles qc
        CROSS JOIN (VALUES
            ('{G1}'::uuid, 720000, 'On Track', 'Pipeline strong; 72% of annualized target achieved'),
            ('{G2}'::uuid, 86, 'On Track', 'NPS improved after support revamp'),
            ('{G3}'::uuid, 100, 'Completed', 'RPA deployed ahead of schedule'),
            ('{G4}'::uuid, 0, 'Completed', 'Zero incidents maintained')
        ) AS v(goal_id, actual, status, comments)
        WHERE qc.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM check_ins ci
            WHERE ci.goal_id = v.goal_id AND ci.quarterly_cycle_id = qc.id AND ci.user_id = '{EMPLOYEE_ID}'
          );
        """
    )

    op.execute(
        f"""
        INSERT INTO check_ins (id, goal_id, user_id, quarterly_cycle_id, actual_value, status, comments, created_at, updated_at)
        SELECT gen_random_uuid(), '{G7}', '{EMPLOYEE2_ID}', qc.id, 78, 'On Track', 'Survey scheduled for next week', now(), now()
        FROM quarterly_cycles qc
        WHERE qc.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM check_ins ci WHERE ci.goal_id = '{G7}' AND ci.quarterly_cycle_id = qc.id
          );
        """
    )

    # Manager check-in comments
    op.execute(
        f"""
        INSERT INTO check_in_comments (id, check_in_id, user_id, comment, created_at, updated_at)
        SELECT gen_random_uuid(), ci.id, '{MANAGER_ID}',
            'Great progress on revenue. Focus on closing enterprise deals in March.', now(), now()
        FROM check_ins ci
        JOIN goals g ON g.id = ci.goal_id
        WHERE g.id = '{G1}' AND ci.user_id = '{EMPLOYEE_ID}'
          AND NOT EXISTS (
            SELECT 1 FROM check_in_comments c WHERE c.check_in_id = ci.id AND c.user_id = '{MANAGER_ID}'
          );
        """
    )

    # Goal approval comment
    op.execute(
        f"""
        INSERT INTO goal_comments (id, goal_id, user_id, comment, created_at, updated_at)
        SELECT gen_random_uuid(), '{G1}', '{MANAGER_ID}',
            'Targets aligned with regional plan. Approved with 30% weightage.', now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM goal_comments WHERE goal_id = '{G1}' AND user_id = '{MANAGER_ID}');
        """
    )

    # Audit trail samples
    op.execute(
        f"""
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_value, new_value, created_at, updated_at)
        SELECT gen_random_uuid(), '{MANAGER_ID}', 'Approve', 'goals', '{G1}'::uuid,
            '{{"status": "Submitted"}}'::jsonb, '{{"status": "Approved", "is_locked": true}}'::jsonb, now() - interval '7 days', now()
        WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE record_id = '{G1}' AND action = 'Approve');
        """
    )
    op.execute(
        f"""
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_value, new_value, created_at, updated_at)
        SELECT gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', 'CheckIn', 'check_ins', '{G1}'::uuid,
            NULL, '{{"actual_value": 720000, "status": "On Track"}}'::jsonb, now() - interval '2 days', now()
        WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE record_id = '{G1}' AND action = 'CheckIn');
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM check_in_comments WHERE check_in_id IN (
            SELECT id FROM check_ins WHERE user_id IN (
                'e0000000-0000-4000-8000-000000000002',
                'e0000000-0000-4000-8000-000000000003'
            )
        );
        DELETE FROM check_ins WHERE user_id IN (
            'e0000000-0000-4000-8000-000000000002',
            'e0000000-0000-4000-8000-000000000003'
        );
        DELETE FROM goal_comments WHERE goal_id::text LIKE 'c0000000%';
        DELETE FROM shared_goals WHERE goal_id::text LIKE 'c0000000%';
        DELETE FROM audit_logs WHERE record_id::text LIKE 'c0000000%';
        DELETE FROM goals WHERE id::text LIKE 'c0000000%';
        DELETE FROM manager_employee WHERE manager_id = 'b0000000-0000-4000-8000-000000000001';
        DELETE FROM user_roles WHERE user_id IN (
            SELECT id FROM users WHERE email IN (
                'employee@goaltracker.dev', 'employee2@goaltracker.dev', 'manager@goaltracker.dev'
            )
        );
        DELETE FROM users WHERE email IN (
            'employee@goaltracker.dev', 'employee2@goaltracker.dev', 'manager@goaltracker.dev'
        );
        """
    )
