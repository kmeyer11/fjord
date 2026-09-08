"""rename task status 'scheduled' to 'in_progress'

Revision ID: 8be255681e3f
Revises: f4a8b2c9d1e3
Create Date: 2026-09-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '8be255681e3f'
down_revision: Union[str, Sequence[str], None] = 'f4a8b2c9d1e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """The 'scheduled' status predates removing tasks from the calendar and no
    longer describes what the middle board column means — rename it to
    in_progress. The status column has no CHECK constraint (only criticality
    does), so this is a plain data update, no schema change needed."""
    op.execute("UPDATE tasks SET status = 'in_progress' WHERE status = 'scheduled'")


def downgrade() -> None:
    op.execute("UPDATE tasks SET status = 'scheduled' WHERE status = 'in_progress'")
