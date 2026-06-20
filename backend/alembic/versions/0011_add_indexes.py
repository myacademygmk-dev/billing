"""add missing indexes for performance

Revision ID: 0011_add_indexes
Revises: 0010_savings_is_edited
Create Date: 2026-06-20

"""

from alembic import op

revision = "0011_add_indexes"
down_revision = "0010_savings_is_edited"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_students_class_name", "students", ["class_name"])
    op.create_index("ix_students_batch", "students", ["batch"])
    op.create_index("ix_students_status", "students", ["status"])
    op.create_index("ix_savings_entries_student_id", "savings_entries", ["student_id"])
    op.create_index("ix_student_billing_periods_payment_id", "student_billing_periods", ["payment_id"])
    op.create_index("ix_payments_created_by", "payments", ["created_by"])


def downgrade() -> None:
    op.drop_index("ix_payments_created_by", table_name="payments")
    op.drop_index("ix_student_billing_periods_payment_id", table_name="student_billing_periods")
    op.drop_index("ix_savings_entries_student_id", table_name="savings_entries")
    op.drop_index("ix_students_status", table_name="students")
    op.drop_index("ix_students_batch", table_name="students")
    op.drop_index("ix_students_class_name", table_name="students")
