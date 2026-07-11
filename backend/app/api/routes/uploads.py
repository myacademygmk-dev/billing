"""File upload routes — handles image/document uploads, stores to local disk."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.file_upload import FileUpload
from app.models.user import User

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}


@router.post("", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    entity_type: str | None = None,
    entity_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Upload a file (image/PDF). Returns the URL to access it."""
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File too large. Max 5MB.")

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1] or ".bin"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    # Write to disk
    with open(file_path, "wb") as f:
        f.write(content)

    # Store record
    url = f"/api/uploads/files/{unique_name}"
    record = FileUpload(
        filename=unique_name,
        original_name=file.filename or "unknown",
        content_type=file.content_type,
        size_bytes=len(content),
        url=url,
        uploaded_by=current_user.id,
        entity_type=entity_type,
        entity_id=uuid.UUID(entity_id) if entity_id else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": str(record.id), "url": url, "filename": record.original_name, "size": record.size_bytes}


@router.get("/files/{filename}")
async def serve_file(filename: str) -> Response:
    """Serve an uploaded file."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content = file_path.read_bytes()
    # Determine content type from extension
    ext = file_path.suffix.lower()
    content_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".pdf": "application/pdf"}
    ct = content_types.get(ext, "application/octet-stream")

    return Response(content=content, media_type=ct, headers={"Cache-Control": "public, max-age=31536000"})


@router.delete("/{file_id}", status_code=204, response_class=Response, response_model=None)
def delete_file(
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    record = db.get(FileUpload, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    # Delete from disk
    file_path = UPLOAD_DIR / record.filename
    if file_path.exists():
        file_path.unlink()
    db.delete(record)
    db.commit()
    return Response(status_code=204)
