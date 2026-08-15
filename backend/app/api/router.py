from fastapi import APIRouter, Depends

from app.api.deps import require_admin_user
from app.api.routes import auth, academic, attendance, cms, creativity, enquiries, exams, expenses, export, fee_mgmt, health, payments, public, reports, savings, settings, staff, students, testimonials, uploads, utilities


api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(savings.router, prefix="/savings", tags=["savings"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(export.router, prefix="/export", tags=["export"], dependencies=[Depends(require_admin_user)])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"], dependencies=[Depends(require_admin_user)])
# New modules
api_router.include_router(staff.router, prefix="/staff", tags=["staff"])
api_router.include_router(academic.router, prefix="/academic", tags=["academic"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(cms.router, prefix="/cms", tags=["cms"])
api_router.include_router(fee_mgmt.router, prefix="/fees", tags=["fees"], dependencies=[Depends(require_admin_user)])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(enquiries.router, prefix="/enquiries", tags=["enquiries"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(utilities.router, prefix="/utils", tags=["utilities"])
api_router.include_router(creativity.router, prefix="/creativity", tags=["creativity"], dependencies=[Depends(require_admin_user)])
api_router.include_router(testimonials.router, prefix="/testimonials", tags=["testimonials"], dependencies=[Depends(require_admin_user)])
