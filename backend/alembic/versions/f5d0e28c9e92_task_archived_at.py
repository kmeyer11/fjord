"""task archived_at

Revision ID: f5d0e28c9e92
Revises: d4f9a1b2c3e5
Create Date: 2026-09-10 12:27:40.815716

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5d0e28c9e92'
down_revision: Union[str, Sequence[str], None] = 'd4f9a1b2c3e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set when a task is manually archived on demand, independent of the
    completed_at/ARCHIVE_AFTER auto-archive rule (see _is_archived in
    routers/projects.py)."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('archived_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_column('archived_at')
