"""enquiries, file_uploads, expense categories, student promotion fields

Revision ID: 0017_enquiries_uploads_expenses
Revises: 0016_attendance
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa


revision = "0017_enquiries_uploads_expenses"
down_revision = "0016_attendance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enquiries table
    op.create_table(
        "enquiries",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("student_name", sa.String(200), nullable=False),
        sa.Column("parent_name", sa.String(200), nullable=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(200), nullable=True),
        sa.Column("standard", sa.String(50), nullable=True),
        sa.Column("board", sa.String(50), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("source", sa.String(50), nullable=True, server_default="website"),
        sa.Column("status", sa.String(30), nullable=False, server_default="new"),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("follow_up_notes", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # File uploads table
    op.create_table(
        "file_uploads",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("filename", sa.String(300), nullable=False),
        sa.Column("original_name", sa.String(300), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("uploaded_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Add expense category to expense_entries
    op.add_column("expense_entries", sa.Column("category", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("expense_entries", "category")
    op.drop_table("file_uploads")
    op.drop_table("enquiries")
