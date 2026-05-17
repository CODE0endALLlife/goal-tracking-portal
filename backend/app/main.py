from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .api.v1 import auth_router, goal_router, check_in_router, admin_router, reporting_router, websocket_router

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
