"""Restore the revision used by installations with public page sections.

The website implementation was reverted after this revision had been applied
to some databases. Retain its nullable content column and migration identity
so those installations can continue upgrading without resetting their history.
"""
from alembic import op
import sqlalchemy as sa

revision = "0027_public_page_sections"
down_revision = "0026_payment_month_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institution_settings", sa.Column("page_sections", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("institution_settings", "page_sections")
