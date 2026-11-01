"""Add the configurable homepage Alumni count."""
from alembic import op
import sqlalchemy as sa

revision = "0029_alumni_stat"
down_revision = "0028_merge_public_and_marks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institution_settings", sa.Column("stats_alumni", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("institution_settings", "stats_alumni")
