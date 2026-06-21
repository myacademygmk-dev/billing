"""add staff role and user email

Revision ID: 0012_staff_role_email
Revises: 0011_add_indexes
Create Date: 2026-06-20

"""

from alembic import op
import sqlalchemy as sa

revision = "0012_staff_role_email"
down_revision = "0011_add_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'staff' to user_role enum
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff'")
    # Add email column
    op.add_column("users", sa.Column("email", sa.String(200), unique=True, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "email")
    # Note: PostgreSQL doesn't support removing enum values easily
