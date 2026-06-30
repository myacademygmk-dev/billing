from fastapi import APIRouter, Depends

from app.api.deps import require_admin_user
from app.api.routes import auth, expenses, export, health, payments, reports, savings, settings, students


api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(savings.router, prefix="/savings", tags=["savings"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"], dependencies=[Depends(require_admin_user)])
# Admin-only routes
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(export.router, prefix="/export", tags=["export"], dependencies=[Depends(require_admin_user)])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"], dependencies=[Depends(require_admin_user)])
