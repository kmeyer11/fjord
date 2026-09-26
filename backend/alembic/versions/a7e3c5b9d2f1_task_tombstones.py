"""task tombstones for calendar feed cancellations

Revision ID: a7e3c5b9d2f1
Revises: f5d0e28c9e92
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7e3c5b9d2f1'
down_revision: Union[str, Sequence[str], None] = 'f5d0e28c9e92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # tasks.id doubles as the feed event's UID, so it must never be reused:
    # plain INTEGER PRIMARY KEY lets SQLite hand a new row the id of the
    # most recently deleted one, which would collide with its tombstone.
    with op.batch_alter_table('tasks', recreate='always', table_kwargs={'sqlite_autoincrement': True}):
        pass

    op.create_table(
        'task_tombstones',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('due_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('task_id'),
    )


def downgrade() -> None:
    op.drop_table('task_tombstones')

    with op.batch_alter_table('tasks', recreate='always', table_kwargs={'sqlite_autoincrement': False}):
        pass
