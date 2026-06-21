from __future__ import annotations

import os

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/billing"
    jwt_secret: str = "dev-secret-change-me"

    cors_origins: list[str] = ["http://localhost:3000"]
    receipt_prefix: str = "FEE-"

    jwt_algorithm: str = "HS256"
    jwt_access_token_exp_minutes: int = 60 * 2  # 2 hours

    # DB pool
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # File upload
    max_upload_size_mb: int = 5

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value.removeprefix("postgres://")
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value.removeprefix("postgresql://")
        return value

    @model_validator(mode="after")
    def _check_production_secrets(self):
        if os.getenv("APP_ENV") == "production":
            if self.jwt_secret in ("dev-secret-change-me", "change-me"):
                raise ValueError("JWT_SECRET must be set to a strong value in production")
        return self


settings = Settings()  # type: ignore[call-arg]
