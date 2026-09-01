"""project favorite

Revision ID: f4a8b2c9d1e3
Revises: e1f86163f3d6
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a8b2c9d1e3'
down_revision: Union[str, Sequence[str], None] = 'c7f2a1e6d4b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Marks a project as a favorite, pinning it to the top of the dashboard and sidebar."""
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('favorite', sa.Boolean(), nullable=False, server_default=sa.false()))
    with op.batch_alter_table('projects') as batch_op:
        batch_op.alter_column('favorite', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('projects') as batch_op:
        batch_op.drop_column('favorite')
