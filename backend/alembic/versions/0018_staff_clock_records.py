"""add staff clock records table

Revision ID: 0018_staff_clock_records
Revises: 0017_enquiries_uploads_expenses
Create Date: 2026-08-02
"""
from alembic import op
import sqlalchemy as sa


revision = "0018_staff_clock_records"
down_revision = "0017_enquiries_uploads_expenses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "staff_clock_records",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("staff_id", sa.Uuid(as_uuid=True), sa.ForeignKey("staff.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("clock_in", sa.DateTime(timezone=True), nullable=False),
        sa.Column("clock_out", sa.DateTime(timezone=True), nullable=True),
        sa.Column("clock_in_note", sa.String(200), nullable=True),
        sa.Column("clock_out_note", sa.String(200), nullable=True),
        sa.Column("recorded_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="present"),
        sa.Column("total_hours", sa.Numeric(5, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_staff_clock_records_staff_id", "staff_clock_records", ["staff_id"])
    op.create_index("ix_staff_clock_records_date", "staff_clock_records", ["date"])
    op.create_index(
        "uq_staff_clock_records_staff_date",
        "staff_clock_records",
        ["staff_id", "date"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_table("staff_clock_records")
