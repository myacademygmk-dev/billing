"""add hero_slides to institution_settings

Revision ID: 0022_hero_slides
Revises: 0021_popup_banner
"""
from alembic import op
import sqlalchemy as sa

revision = "0022_hero_slides"
down_revision = "0021_popup_banner"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institution_settings", sa.Column("hero_slides", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("institution_settings", "hero_slides")
