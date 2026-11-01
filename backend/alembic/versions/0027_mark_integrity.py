"""Protect a student's subject score from duplicates and invalid ranges.

Existing anomalies must be reviewed, never silently deleted or rewritten.
"""
from alembic import op
import sqlalchemy as sa

revision = "0027_mark_integrity"
down_revision = "0026_payment_month_history"
branch_labels = None
depends_on = None


def upgrade():
    db = op.get_bind()
    invalid = db.execute(sa.text("SELECT COUNT(*) FROM marks WHERE max_marks <= 0 OR marks_obtained < 0 OR marks_obtained > max_marks")).scalar()
    duplicates = db.execute(sa.text("SELECT COUNT(*) FROM (SELECT 1 FROM marks GROUP BY exam_id, student_id, subject_id HAVING COUNT(*) > 1) AS duplicates")).scalar()
    if invalid or duplicates:
        raise RuntimeError(f"Review existing marks before migrating: {invalid} invalid scores, {duplicates} duplicate student/subject groups. No records were modified.")
    op.create_unique_constraint("uq_marks_exam_student_subject", "marks", ["exam_id", "student_id", "subject_id"])
    op.create_check_constraint("ck_marks_score_range", "marks", "max_marks > 0 AND marks_obtained >= 0 AND marks_obtained <= max_marks")


def downgrade():
    op.drop_constraint("ck_marks_score_range", "marks", type_="check")
    op.drop_constraint("uq_marks_exam_student_subject", "marks", type_="unique")
