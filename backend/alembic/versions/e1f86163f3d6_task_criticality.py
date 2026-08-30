"""task criticality

Revision ID: e1f86163f3d6
Revises: 19882cbfbb24
Create Date: 2026-08-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f86163f3d6'
down_revision: Union[str, Sequence[str], None] = '19882cbfbb24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Replace the low/medium/high priority enum with a 1-5 criticality scale."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('criticality', sa.Integer(), nullable=False, server_default='3'))

    op.execute(
        "UPDATE tasks SET criticality = CASE priority "
        "WHEN 'low' THEN 1 WHEN 'medium' THEN 3 WHEN 'high' THEN 5 ELSE 3 END"
    )

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_column('priority')
        batch_op.alter_column('criticality', server_default=None)
        batch_op.create_check_constraint('ck_tasks_criticality_range', 'criticality BETWEEN 1 AND 5')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(
            sa.Column(
                'priority',
                sa.Enum('low', 'medium', 'high', name='taskpriority'),
                nullable=False,
                server_default='medium',
            )
        )

    op.execute(
        "UPDATE tasks SET priority = CASE "
        "WHEN criticality <= 2 THEN 'low' WHEN criticality >= 4 THEN 'high' ELSE 'medium' END"
    )

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_constraint('ck_tasks_criticality_range', type_='check')
        batch_op.drop_column('criticality')
        batch_op.alter_column('priority', server_default=None)
