"""Agregar imagen a productos

Revision ID: e7b1c5f4a2d9
Revises: d06291d6360c
Create Date: 2026-10-07
"""

from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


revision: str = "e7b1c5f4a2d9"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "d06291d6360c"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "image_url",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "products",
        "image_url",
    )
