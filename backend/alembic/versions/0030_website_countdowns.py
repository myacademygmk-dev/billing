"""Allow up to four website countdowns."""
from alembic import op
import sqlalchemy as sa

revision = '0030_website_countdowns'
down_revision = '0029_alumni_stat'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('institution_settings', sa.Column('countdowns', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('institution_settings', 'countdowns')
