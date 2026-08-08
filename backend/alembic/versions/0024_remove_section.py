"""remove section column from students

Revision ID: 0024_remove_section
Revises: 0023_profile_fields
"""
from alembic import op

revision = "0024_remove_section"
down_revision = "0023_profile_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("students", "section")


def downgrade() -> None:
    import sqlalchemy as sa
    op.add_column("students", sa.Column("section", sa.String(50), nullable=True))
