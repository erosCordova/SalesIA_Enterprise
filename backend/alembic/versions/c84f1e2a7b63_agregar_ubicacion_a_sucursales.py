"""agregar ubicacion a sucursales

Revision ID: c84f1e2a7b63
Revises: e7b1c5f4a2d9
"""

from alembic import op
import sqlalchemy as sa


revision = "c84f1e2a7b63"
down_revision = "e7b1c5f4a2d9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "branches",
        sa.Column(
            "department",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "branches",
        sa.Column(
            "latitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "branches",
        sa.Column(
            "longitude",
            sa.Float(),
            nullable=True,
        ),
    )

    op.create_check_constraint(
        "ck_branches_latitude_range",
        "branches",
        (
            "latitude IS NULL OR "
            "(latitude >= -90 AND latitude <= 90)"
        ),
    )

    op.create_check_constraint(
        "ck_branches_longitude_range",
        "branches",
        (
            "longitude IS NULL OR "
            "(longitude >= -180 AND longitude <= 180)"
        ),
    )


def downgrade():
    op.drop_constraint(
        "ck_branches_longitude_range",
        "branches",
        type_="check",
    )

    op.drop_constraint(
        "ck_branches_latitude_range",
        "branches",
        type_="check",
    )

    op.drop_column(
        "branches",
        "longitude",
    )

    op.drop_column(
        "branches",
        "latitude",
    )

    op.drop_column(
        "branches",
        "department",
    )
