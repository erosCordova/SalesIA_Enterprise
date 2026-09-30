"""add branches organization

Revision ID: fc127d36f00c
Revises: 9f2c7a4d8e11
Create Date: 2026-09-30 13:34:20.757119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc127d36f00c'
down_revision: Union[str, Sequence[str], None] = '9f2c7a4d8e11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
