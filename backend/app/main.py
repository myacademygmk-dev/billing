import logging
import os
import time
import uuid as uuid_mod

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    is_production = os.getenv("APP_ENV", "development") == "production"

    app = FastAPI(
        title="Fee Collection",
        version="0.1.0",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        if isinstance(exc, HTTPException):
            raise exc
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error("Unhandled error [%s]: %s", request_id, str(exc), exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})

    @app.middleware("http")
    async def request_middleware(request: Request, call_next):
        request_id = str(uuid_mod.uuid4())[:8]
        request.state.request_id = request_id
        start = time.time()

        # Reject oversized request bodies
        content_length = request.headers.get("content-length")
        max_body = settings.max_upload_size_mb * 1024 * 1024
        if content_length and int(content_length) > max_body:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})

        response: Response = await call_next(request)
        duration = time.time() - start

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "%s %s %d %.3fs",
            request.method, request.url.path, response.status_code, duration,
        )
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(api_router)
    return app


app = create_app()
