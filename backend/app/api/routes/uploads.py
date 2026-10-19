"""File upload routes — handles image/document uploads, stores to local disk."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.models.file_upload import FileUpload
from app.models.user import User

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
ALLOWED_EXTENSIONS = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
    "image/gif": {".gif"},
    "application/pdf": {".pdf"},
}
CONTENT_TYPES_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
}


def _content_matches_type(content: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    if content_type == "image/gif":
        return content.startswith((b"GIF87a", b"GIF89a"))
    if content_type == "application/pdf":
        return content.startswith(b"%PDF-")
    return False


def _safe_upload_path(filename: str) -> Path:
    if filename != Path(filename).name:
        raise HTTPException(status_code=404, detail="File not found")
    ext = Path(filename).suffix.lower()
    stem = Path(filename).stem
    if ext not in CONTENT_TYPES_BY_EXT or len(stem) != 32:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        int(stem, 16)
    except ValueError:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = (UPLOAD_DIR / filename).resolve()
    upload_root = UPLOAD_DIR.resolve()
    if upload_root not in file_path.parents:
        raise HTTPException(status_code=404, detail="File not found")
    return file_path


@router.post("", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    entity_type: str | None = None,
    entity_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("cms")),
) -> dict:
    """Upload a file (image/PDF). Returns the URL to access it."""
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="File is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File too large. Max 5MB.")

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1].lower()
    if ext not in ALLOWED_EXTENSIONS[file.content_type]:
        raise HTTPException(status_code=422, detail="File extension does not match content type")
    if not _content_matches_type(content, file.content_type):
        raise HTTPException(status_code=422, detail="File content does not match content type")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    # Write to disk
    with open(file_path, "wb") as f:
        f.write(content)

    # Store record
    url = f"/api/uploads/files/{unique_name}"
    try:
        parsed_entity_id = uuid.UUID(entity_id) if entity_id else None
    except ValueError:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="entity_id must be a valid UUID")
    record = FileUpload(
        filename=unique_name,
        original_name=file.filename or "unknown",
        content_type=file.content_type,
        size_bytes=len(content),
        url=url,
        uploaded_by=current_user.id,
        entity_type=entity_type,
        entity_id=parsed_entity_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": str(record.id), "url": url, "filename": record.original_name, "size": record.size_bytes}


@router.get("/files/{filename}")
async def serve_file(filename: str, db: Session = Depends(get_db)) -> Response:
    """Serve an uploaded file."""
    record = db.execute(select(FileUpload).where(FileUpload.filename == filename)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = _safe_upload_path(filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content = file_path.read_bytes()
    ct = CONTENT_TYPES_BY_EXT[file_path.suffix.lower()]

    return Response(content=content, media_type=ct, headers={"Cache-Control": "public, max-age=31536000"})


@router.delete("/{file_id}", status_code=204, response_class=Response, response_model=None)
def delete_file(
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("cms")),
) -> Response:
    record = db.get(FileUpload, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    # Delete from disk
    file_path = _safe_upload_path(record.filename)
    if file_path.exists():
        file_path.unlink()
    db.delete(record)
    db.commit()
    return Response(status_code=204)
