# Goal Tracking Portal

Enterprise Goal Setting & Performance Tracking System

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Alembic migrations
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Auth**: JWT (access + refresh tokens), RBAC
- **Deployment**: Docker, Docker Compose

## Quick Start

### 1. Clone & Configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit backend/.env — set a strong SECRET_KEY
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

### 3. Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## User Roles

| Role | Permissions |
|------|-------------|
| Employee | Create/edit goals, submit for approval, submit check-ins |
| Manager (L1) | Approve/reject team goals, view team performance, add check-in comments |
| Admin/HR | All permissions + user management, goal unlocks, audit logs, reports |

### Demo accounts (hackathon showcase)

After `alembic upgrade head`, pre-loaded data includes goals, check-ins, shared KPIs, and audit logs.

| Role | Email | Password | Landing page |
|------|-------|----------|--------------|
| **Employee** | `employee@goaltracker.dev` | `Demo123!` | Dashboard with 4 approved goals, charts, Q4 check-ins |
| **Employee 2** | `employee2@goaltracker.dev` | `Demo123!` | Goals pending manager approval |
| **Manager (L1)** | `manager@goaltracker.dev` | `Demo123!` | Team approvals & analytics |
| **Admin / HR** | `admin@goaltracker.dev` | `Admin123!` | User management, reports, audit trail |

New registrations via `/register` get the **Employee** role only. Promote users from **Admin → Users** → **Add role…**.

## Key Features

- ✅ Goal creation with thrust areas, unit of measurement, weightage
- ✅ Weightage validation (total must equal 100%, min 10% per goal, max 8 goals)
- ✅ Manager approval workflow with inline target/weightage edits
- ✅ Goal locking after approval (admin unlock only)
- ✅ Quarterly check-ins with planned vs actual tracking
- ✅ Progress calculation (Numeric, Percentage, Timeline, Zero-based)
- ✅ Shared goals
- ✅ Full audit logging (action, user, old/new values, timestamp)
- ✅ Reporting dashboards with CSV export
- ✅ Role-based access control (RBAC)
- ✅ JWT auth with refresh tokens
- ✅ WebSocket notifications
- ✅ Email notifications (configurable via SMTP)

## Project Structure

```
goal-tracking-portal/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── api/v1/          # FastAPI routers
│   │   ├── repositories/    # Data access layer
│   │   ├── utils/           # Validators, calculators
│   │   └── migrations/      # Alembic migrations
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # Reusable UI components
│       ├── hooks/           # React Query hooks
│       ├── store/           # Zustand stores
│       ├── types/           # TypeScript types
│       └── lib/             # Utilities, API client
└── docker-compose.yml
```

## Running Tests

```bash
cd backend
pytest tests/ -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/goal_tracking` |
| `SECRET_KEY` | JWT signing secret (change in prod!) | `changeme-...` |
| `REDIS_URL` | Redis URL | `redis://redis:6379/0` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:3000"]` |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `http://localhost:8000` |
