from __future__ import annotations

from urllib.parse import urlparse


PUBLIC_PATH_PREFIXES = ("/api/uploads/files/", "/images/")
IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}


def is_safe_public_url(value: str | None) -> bool:
    if not value:
        return False
    if value.startswith(PUBLIC_PATH_PREFIXES):
        return True
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def is_local_public_url(value: str | None) -> bool:
    return bool(value and value.startswith(PUBLIC_PATH_PREFIXES))


def safe_public_url(value: str | None) -> str | None:
    cleaned = value.strip() if value else None
    return cleaned if is_safe_public_url(cleaned) else None


def safe_youtube_url(value: str | None) -> str | None:
    cleaned = value.strip() if value else None
    if not cleaned:
        return None
    parsed = urlparse(cleaned)
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme not in {"http", "https"} or hostname not in YOUTUBE_HOSTS:
        return None
    if hostname.endswith("youtu.be"):
        return cleaned if parsed.path.strip("/") else None
    if parsed.path == "/watch" and parsed.query:
        return cleaned
    if parsed.path.startswith(("/embed/", "/shorts/")):
        return cleaned
    return None


def pipe_list(value: str | None, *, youtube_only: bool = False) -> list[str]:
    sanitizer = safe_youtube_url if youtube_only else safe_public_url
    return [safe for part in (value or "").split("|") if (safe := sanitizer(part))]
