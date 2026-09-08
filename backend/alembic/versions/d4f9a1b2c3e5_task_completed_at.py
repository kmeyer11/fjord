"""task completed_at

Revision ID: d4f9a1b2c3e5
Revises: 8be255681e3f
Create Date: 2026-09-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f9a1b2c3e5'
down_revision: Union[str, Sequence[str], None] = '8be255681e3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Timestamps when a task last entered 'done', so the project board can
    tell how long it's been sitting there and auto-archive it after 14 days
    (see ARCHIVE_AFTER in routers/projects.py). Backfilled from updated_at for
    existing done tasks as a best-effort stand-in for their real completion time."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('completed_at', sa.DateTime(), nullable=True))
    op.execute("UPDATE tasks SET completed_at = updated_at WHERE status = 'done'")


def downgrade() -> None:
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_column('completed_at')
