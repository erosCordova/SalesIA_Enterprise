"""agregar tablas motor estadistico

Revision ID: d06291d6360c
Revises: f06b001
Create Date: 2026-10-01 16:29:53.434857

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd06291d6360c'
down_revision: Union[str, Sequence[str], None] = 'f06b001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
