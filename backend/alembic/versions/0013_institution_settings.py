"""add institution_settings table

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa


revision = "0013_institution_settings"
down_revision = "0012_staff_role_email"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "institution_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, server_default="MY Academy"),
        sa.Column("tagline", sa.String(300), nullable=False, server_default="Educational Institutions"),
        sa.Column("registration_no", sa.String(100), nullable=False, server_default="Regd.No - 469/2016"),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(200), nullable=True),
        sa.Column("updated_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    # Seed default row
    op.execute(
        "INSERT INTO institution_settings (id, name, tagline, registration_no) "
        "VALUES (1, 'MY Academy', 'Educational Institutions', 'Regd.No - 469/2016')"
    )


def downgrade() -> None:
    op.drop_table("institution_settings")
