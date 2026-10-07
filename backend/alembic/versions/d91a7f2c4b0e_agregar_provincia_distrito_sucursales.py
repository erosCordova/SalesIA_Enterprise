"""agregar provincia y distrito a sucursales

Revision ID: d91a7f2c4b0e
Revises: c84f1e2a7b63
"""

from alembic import op
import sqlalchemy as sa


revision = "d91a7f2c4b0e"
down_revision = "c84f1e2a7b63"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "branches",
        sa.Column(
            "province",
            sa.String(length=120),
            nullable=True,
        ),
    )

    op.add_column(
        "branches",
        sa.Column(
            "district",
            sa.String(length=150),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column(
        "branches",
        "district",
    )

    op.drop_column(
        "branches",
        "province",
    )
