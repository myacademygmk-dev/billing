"""website features: videos, countdown, teams, creativity, testimonials

Revision ID: 0025_website_features
Revises: 0024_remove_section
"""
import sqlalchemy as sa
from alembic import op

revision = "0025_website_features"
down_revision = "0024_remove_section"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to institution_settings
    op.add_column("institution_settings", sa.Column("videos", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("countdown_date", sa.String(50), nullable=True))
    op.add_column("institution_settings", sa.Column("countdown_title", sa.String(200), nullable=True))
    op.add_column("institution_settings", sa.Column("top_bar_text", sa.String(500), nullable=True))
    op.add_column("institution_settings", sa.Column("management_team", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("technical_team", sa.Text(), nullable=True))
    op.add_column("institution_settings", sa.Column("former_staff", sa.Text(), nullable=True))

    # Create student_creativity table
    op.create_table(
        "student_creativity",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("student_name", sa.String(200), nullable=True),
        sa.Column("class_name", sa.String(100), nullable=True),
        sa.Column("file_type", sa.String(20), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("uploaded_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Create testimonials table
    op.create_table(
        "testimonials",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("testimonials")
    op.drop_table("student_creativity")

    op.drop_column("institution_settings", "former_staff")
    op.drop_column("institution_settings", "technical_team")
    op.drop_column("institution_settings", "management_team")
    op.drop_column("institution_settings", "top_bar_text")
    op.drop_column("institution_settings", "countdown_title")
    op.drop_column("institution_settings", "countdown_date")
    op.drop_column("institution_settings", "videos")
