"""academic rollover: promotion_history, student_arrears, academic_year_id columns

Revision ID: 0019_academic_rollover
Revises: 0018_staff_clock_records
Create Date: 2026-08-02
"""
from alembic import op
import sqlalchemy as sa


revision = "0019_academic_rollover"
down_revision = "0018_staff_clock_records"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'completed' to student_status enum
    op.execute("ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'completed'")

    # Add academic_year_id to students
    op.add_column(
        "students",
        sa.Column("academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=True),
    )
    op.create_index("ix_students_academic_year_id", "students", ["academic_year_id"])

    # Add academic_year_id to student_billing_periods
    op.add_column(
        "student_billing_periods",
        sa.Column("academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=True),
    )
    op.create_index("ix_student_billing_periods_academic_year_id", "student_billing_periods", ["academic_year_id"])

    # Create promotion_history table
    op.create_table(
        "promotion_history",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("student_id", sa.Uuid(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("from_class", sa.String(100), nullable=False),
        sa.Column("to_class", sa.String(100), nullable=False),
        sa.Column("from_batch", sa.String(20), nullable=True),
        sa.Column("to_batch", sa.String(20), nullable=True),
        sa.Column("from_student_code", sa.String(50), nullable=False),
        sa.Column("to_student_code", sa.String(50), nullable=False),
        sa.Column("from_academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=True),
        sa.Column("to_academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=True),
        sa.Column("old_fee_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("new_fee_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("promoted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("promoted_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_promotion_history_student_id", "promotion_history", ["student_id"])
    op.create_index("ix_promotion_history_from_academic_year", "promotion_history", ["from_academic_year_id"])
    op.create_index("ix_promotion_history_to_academic_year", "promotion_history", ["to_academic_year_id"])

    # Create student_arrears table
    op.create_table(
        "student_arrears",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("student_id", sa.Uuid(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("from_academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_cleared", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("cleared_payment_id", sa.Uuid(as_uuid=True), sa.ForeignKey("payments.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_student_arrears_student_id", "student_arrears", ["student_id"])
    op.create_index("ix_student_arrears_from_academic_year", "student_arrears", ["from_academic_year_id"])


def downgrade() -> None:
    op.drop_table("student_arrears")
    op.drop_table("promotion_history")
    op.drop_index("ix_student_billing_periods_academic_year_id", table_name="student_billing_periods")
    op.drop_column("student_billing_periods", "academic_year_id")
    op.drop_index("ix_students_academic_year_id", table_name="students")
    op.drop_column("students", "academic_year_id")
    # Note: Cannot remove enum value in PostgreSQL without recreating the type
