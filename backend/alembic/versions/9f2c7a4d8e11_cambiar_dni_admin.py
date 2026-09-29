"""Cambiar DNI del administrador

Revision ID: 9f2c7a4d8e11
Revises: 8c4f1d2a9b71
Create Date: 2026-09-29
"""

from typing import Sequence, Union

from alembic import op


revision: str = "9f2c7a4d8e11"

down_revision: Union[str, None] = "8c4f1d2a9b71"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE users
        SET dni = '87654321'
        WHERE email = 'admin@salesia.com'
          AND dni = '00000001'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE users
        SET dni = '00000001'
        WHERE email = 'admin@salesia.com'
          AND dni = '87654321'
        """
    )
