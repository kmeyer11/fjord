"""meeting recurrence

Revision ID: a3d5e9c1f7b2
Revises: e1f86163f3d6
Create Date: 2026-08-30 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d5e9c1f7b2'
down_revision: Union[str, Sequence[str], None] = 'e1f86163f3d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Groups occurrences of a weekly-recurring meeting under a shared id."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('recurrence_id', sa.String(length=36), nullable=True))
        batch_op.create_index('ix_tasks_recurrence_id', ['recurrence_id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_index('ix_tasks_recurrence_id')
        batch_op.drop_column('recurrence_id')
