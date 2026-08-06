"""add website configuration fields to institution_settings

Revision ID: 0020_website_settings
Revises: 0019_academic_rollover
Create Date: 2026-08-02
"""
from alembic import op
import sqlalchemy as sa


revision = "0020_website_settings"
down_revision = "0019_academic_rollover"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institution_settings", sa.Column("marquee_text", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("stats_students", sa.String(20), nullable=True, server_default="200+"))
    op.add_column("institution_settings", sa.Column("stats_staff", sa.String(20), nullable=True, server_default="22"))
    op.add_column("institution_settings", sa.Column("stats_years", sa.String(20), nullable=True, server_default="15+"))
    op.add_column("institution_settings", sa.Column("stats_standards", sa.String(20), nullable=True, server_default="LKG-12"))
    op.add_column("institution_settings", sa.Column("hero_title", sa.String(200), nullable=True, server_default="MY ACADEMY"))
    op.add_column("institution_settings", sa.Column("hero_subtitle", sa.String(300), nullable=True, server_default="Gain More Knowledge"))
    op.add_column("institution_settings", sa.Column("hero_description", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("admission_text", sa.String(200), nullable=True, server_default="Admissions Open for 2025-2026"))
    op.add_column("institution_settings", sa.Column("alumni_data", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("faculty_data", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("facilities_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("institution_settings", "facilities_data")
    op.drop_column("institution_settings", "faculty_data")
    op.drop_column("institution_settings", "alumni_data")
    op.drop_column("institution_settings", "admission_text")
    op.drop_column("institution_settings", "hero_description")
    op.drop_column("institution_settings", "hero_subtitle")
    op.drop_column("institution_settings", "hero_title")
    op.drop_column("institution_settings", "stats_standards")
    op.drop_column("institution_settings", "stats_years")
    op.drop_column("institution_settings", "stats_staff")
    op.drop_column("institution_settings", "stats_students")
    op.drop_column("institution_settings", "marquee_text")
