"""add attendance tables

Revision ID: 0016_attendance
Revises: 0015_institute_management
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa


revision = "0016_attendance"
down_revision = "0015_institute_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "student_attendance",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("student_id", sa.Uuid(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="present"),
        sa.Column("remarks", sa.String(300), nullable=True),
        sa.Column("marked_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("uq_student_attendance_date", "student_attendance", ["student_id", "date"], unique=True)

    op.create_table(
        "staff_attendance",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("staff_id", sa.Uuid(as_uuid=True), sa.ForeignKey("staff.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="present"),
        sa.Column("remarks", sa.String(300), nullable=True),
        sa.Column("marked_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("uq_staff_attendance_date", "staff_attendance", ["staff_id", "date"], unique=True)


def downgrade() -> None:
    op.drop_table("staff_attendance")
    op.drop_table("student_attendance")
