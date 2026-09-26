"""app settings (user preferences, e.g. the front-page scene)

Revision ID: 61e286f9d953
Revises: a7e3c5b9d2f1
Create Date: 2026-09-26 13:45:20.062977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61e286f9d953'
down_revision: Union[str, Sequence[str], None] = 'a7e3c5b9d2f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Autogenerate also proposes a VARCHAR -> Enum change on tasks.status; that's
    # a SQLite reflection artifact (the column already stores the enum values),
    # so it's left out here.
    op.create_table(
        'app_settings',
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('key'),
    )


def downgrade() -> None:
    op.drop_table('app_settings')
