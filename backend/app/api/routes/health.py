from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db


router = APIRouter()


@router.get("/health", response_model=dict)
def health() -> dict:
    return {"status": "ok"}


@router.get("/health/db", response_model=dict)
def health_db(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "error", "db": "unreachable"})
