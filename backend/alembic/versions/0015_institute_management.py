"""full institute management: student profile, staff, academic, exams, cms, fee structure

Revision ID: 0015_institute_management
Revises: 0014_user_permissions
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


revision = "0015_institute_management"
down_revision = "0014_user_permissions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Create new enum types (safe for re-run) ---
    op.execute("DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('male', 'female', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE staff_role_type AS ENUM ('teacher', 'admin_staff', 'non_teaching', 'part_time'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE staff_status_type AS ENUM ('active', 'inactive', 'resigned'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE exam_type AS ENUM ('monthly_test', 'quarterly', 'half_yearly', 'annual', 'special'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE content_type AS ENUM ('news', 'event', 'achievement', 'gallery', 'circular'); EXCEPTION WHEN duplicate_object THEN null; END $$")

    # --- Expand students table ---
    op.add_column("students", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("students", sa.Column("gender", ENUM("male", "female", "other", name="gender_type", create_type=False), nullable=True))
    op.add_column("students", sa.Column("blood_group", sa.String(10), nullable=True))
    op.add_column("students", sa.Column("photo_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("admission_no", sa.String(50), nullable=True))
    op.add_column("students", sa.Column("father_name", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("mother_name", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("guardian_name", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("parent_phone", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("parent_phone_2", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("parent_email", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("parent_occupation", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("whatsapp_no", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("students", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("students", sa.Column("pincode", sa.String(10), nullable=True))
    op.add_column("students", sa.Column("previous_school", sa.String(300), nullable=True))
    op.add_column("students", sa.Column("subjects", sa.Text(), nullable=True))
    op.add_column("students", sa.Column("emergency_contact", sa.String(200), nullable=True))
    op.add_column("students", sa.Column("emergency_phone", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("notes", sa.Text(), nullable=True))

    # Expand student_status enum with new values
    op.execute("ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'passed_out'")
    op.execute("ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'withdrawn'")
    op.execute("ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'transferred'")

    # --- Staff table ---
    op.create_table(
        "staff",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("staff_code", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("role", ENUM("teacher", "admin_staff", "non_teaching", "part_time", name="staff_role_type", create_type=False), nullable=False),
        sa.Column("status", ENUM("active", "inactive", "resigned", name="staff_status_type", create_type=False), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", ENUM("male", "female", "other", name="gender_type", create_type=False), nullable=True),        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(200), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("qualification", sa.String(300), nullable=True),
        sa.Column("specialization", sa.String(300), nullable=True),
        sa.Column("subjects", sa.Text(), nullable=True),
        sa.Column("classes_assigned", sa.Text(), nullable=True),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("leaving_date", sa.Date(), nullable=True),
        sa.Column("monthly_salary", sa.Numeric(12, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Salary records ---
    op.create_table(
        "salary_records",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("staff_id", sa.Uuid(as_uuid=True), sa.ForeignKey("staff.id"), nullable=False),
        sa.Column("month", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("deductions", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("net_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("mode", sa.String(50), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Academic years ---
    op.create_table(
        "academic_years",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Class sections ---
    op.create_table(
        "class_sections",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=False),
        sa.Column("class_name", sa.String(50), nullable=False),
        sa.Column("section", sa.String(20), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Subjects ---
    op.create_table(
        "subjects",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("class_section_id", sa.Uuid(as_uuid=True), sa.ForeignKey("class_sections.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20), nullable=True),
        sa.Column("max_marks", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Exams ---
    op.create_table(
        "exams",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("exam_type", ENUM("monthly_test", "quarterly", "half_yearly", "annual", "special", name="exam_type", create_type=False), nullable=False),
        sa.Column("academic_year_id", sa.Uuid(as_uuid=True), sa.ForeignKey("academic_years.id"), nullable=False),
        sa.Column("class_section_id", sa.Uuid(as_uuid=True), sa.ForeignKey("class_sections.id"), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Marks ---
    op.create_table(
        "marks",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("exam_id", sa.Uuid(as_uuid=True), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("student_id", sa.Uuid(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("subject_id", sa.Uuid(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("marks_obtained", sa.Numeric(6, 2), nullable=False),
        sa.Column("max_marks", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("grade", sa.String(10), nullable=True),
        sa.Column("remarks", sa.String(300), nullable=True),
        sa.Column("entered_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Web content (CMS) ---
    op.create_table(
        "web_contents",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("content_type", ENUM("news", "event", "achievement", "gallery", "circular", name="content_type", create_type=False), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("student_name", sa.String(200), nullable=True),
        sa.Column("class_name", sa.String(100), nullable=True),
        sa.Column("rank", sa.String(50), nullable=True),
        sa.Column("marks", sa.String(50), nullable=True),
        sa.Column("year", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Gallery photos ---
    op.create_table(
        "gallery_photos",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("content_id", sa.Uuid(as_uuid=True), sa.ForeignKey("web_contents.id"), nullable=True),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("caption", sa.String(300), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("uploaded_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Fee structures ---
    op.create_table(
        "fee_structures",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("class_name", sa.String(100), nullable=True),
        sa.Column("academic_year", sa.String(20), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Fee discounts ---
    op.create_table(
        "fee_discounts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("discount_type", sa.String(20), nullable=False, server_default="percentage"),
        sa.Column("value", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Student discounts ---
    op.create_table(
        "student_discounts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("student_id", sa.Uuid(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("discount_id", sa.Uuid(as_uuid=True), sa.ForeignKey("fee_discounts.id"), nullable=False),
        sa.Column("applied_by", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("notes", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("student_discounts")
    op.drop_table("fee_discounts")
    op.drop_table("fee_structures")
    op.drop_table("gallery_photos")
    op.drop_table("web_contents")
    op.drop_table("marks")
    op.drop_table("exams")
    op.drop_table("subjects")
    op.drop_table("class_sections")
    op.drop_table("academic_years")
    op.drop_table("salary_records")
    op.drop_table("staff")

    op.drop_column("students", "notes")
    op.drop_column("students", "emergency_phone")
    op.drop_column("students", "emergency_contact")
    op.drop_column("students", "subjects")
    op.drop_column("students", "previous_school")
    op.drop_column("students", "pincode")
    op.drop_column("students", "city")
    op.drop_column("students", "address")
    op.drop_column("students", "whatsapp_no")
    op.drop_column("students", "parent_occupation")
    op.drop_column("students", "parent_email")
    op.drop_column("students", "parent_phone_2")
    op.drop_column("students", "parent_phone")
    op.drop_column("students", "guardian_name")
    op.drop_column("students", "mother_name")
    op.drop_column("students", "father_name")
    op.drop_column("students", "admission_no")
    op.drop_column("students", "photo_url")
    op.drop_column("students", "blood_group")
    op.drop_column("students", "gender")
    op.drop_column("students", "date_of_birth")

    op.execute("DROP TYPE IF EXISTS content_type")
    op.execute("DROP TYPE IF EXISTS exam_type")
    op.execute("DROP TYPE IF EXISTS staff_status_type")
    op.execute("DROP TYPE IF EXISTS staff_role_type")
    op.execute("DROP TYPE IF EXISTS gender_type")
