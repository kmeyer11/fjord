"""drop task tombstones

Subscribed calendars replace their copy of the feed on every refresh, so a
deleted meeting disappears by just being left out. Publishing it as
STATUS:CANCELLED made Apple Calendar keep it around marked "Cancelled".

Revision ID: b8d4f2a6c1e7
Revises: 61e286f9d953
Create Date: 2026-09-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8d4f2a6c1e7'
down_revision: Union[str, Sequence[str], None] = '61e286f9d953'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('task_tombstones')


def downgrade() -> None:
    op.create_table(
        'task_tombstones',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('due_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('task_id'),
    )
