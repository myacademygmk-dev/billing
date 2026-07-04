"""add permissions column to users

Revision ID: 0014_user_permissions
Revises: 0013_institution_settings
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa


revision = "0014_user_permissions"
down_revision = "0013_institution_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("permissions", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "permissions")
