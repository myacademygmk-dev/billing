"""add student and staff profile fields

Revision ID: 0023_profile_fields
Revises: 0022_hero_slides
"""
from alembic import op
import sqlalchemy as sa

revision = "0023_profile_fields"
down_revision = "0022_hero_slides"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Student new fields
    op.add_column("students", sa.Column("school_name", sa.String(300), nullable=True))
    op.add_column("students", sa.Column("hobbies", sa.Text(), nullable=True))
    op.add_column("students", sa.Column("student_email", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("father_occupation", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("mother_occupation", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("contact_no", sa.String(20), nullable=True))

    # Staff new fields
    op.add_column("staff", sa.Column("designation", sa.String(200), nullable=True))
    op.add_column("staff", sa.Column("experience", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("staff", "experience")
    op.drop_column("staff", "designation")
    op.drop_column("students", "contact_no")
    op.drop_column("students", "mother_occupation")
    op.drop_column("students", "father_occupation")
    op.drop_column("students", "student_email")
    op.drop_column("students", "hobbies")
    op.drop_column("students", "school_name")
