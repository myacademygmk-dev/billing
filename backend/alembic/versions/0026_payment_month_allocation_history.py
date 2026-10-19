"""add immutable payment month allocation history

Revision ID: 0026_payment_month_history
Revises: 0025_website_features
"""

import sqlalchemy as sa
from alembic import op


revision = "0026_payment_month_history"
down_revision = "0025_website_features"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payment_month_allocations",
        sa.Column(
            "payment_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("payments.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("period_month", sa.Date(), primary_key=True, nullable=False),
        sa.Column(
            "student_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_payment_month_allocations_student_period",
        "payment_month_allocations",
        ["student_id", "period_month"],
    )
    op.execute(
        """
        INSERT INTO payment_month_allocations (payment_id, period_month, student_id)
        SELECT payment_id, period_month, student_id
        FROM student_billing_periods
        WHERE payment_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_payment_month_allocations_student_period",
        table_name="payment_month_allocations",
    )
    op.drop_table("payment_month_allocations")
