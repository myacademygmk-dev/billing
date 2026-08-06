"""add popup_banner_url to institution_settings

Revision ID: 0021_popup_banner
Revises: 0020_website_settings
"""
from alembic import op
import sqlalchemy as sa

revision = "0021_popup_banner"
down_revision = "0020_website_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institution_settings", sa.Column("popup_banner_url", sa.String(500), nullable=True))
    op.add_column("institution_settings", sa.Column("hero_slides", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("institution_settings", "hero_slides")
    op.drop_column("institution_settings", "popup_banner_url")
