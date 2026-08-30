"""task all_day

Revision ID: c7f2a1e6d4b9
Revises: a3d5e9c1f7b2
Create Date: 2026-08-30 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7f2a1e6d4b9'
down_revision: Union[str, Sequence[str], None] = 'a3d5e9c1f7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Marks a task/meeting as spanning the whole day, no specific time."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('all_day', sa.Boolean(), nullable=False, server_default=sa.false()))
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.alter_column('all_day', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_column('all_day')
