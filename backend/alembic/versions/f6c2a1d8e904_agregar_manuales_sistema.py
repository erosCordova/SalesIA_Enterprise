"""agregar manuales del sistema

Revision ID: f6c2a1d8e904
Revises: d91a7f2c4b0e
"""

from alembic import op
import sqlalchemy as sa


revision = "f6c2a1d8e904"
down_revision = "d91a7f2c4b0e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "system_manuals",

        sa.Column(
            "manual_type",
            sa.String(length=20),
            primary_key=True,
        ),

        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),

        sa.Column(
            "file_name",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "mime_type",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "size_bytes",
            sa.BigInteger(),
            nullable=False,
        ),

        sa.Column(
            "content",
            sa.LargeBinary(),
            nullable=False,
        ),

        sa.Column(
            "updated_by",
            sa.String(length=36),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
        ),

        sa.CheckConstraint(
            "manual_type IN ('user', 'technical')",
            name="ck_system_manuals_type",
        ),
    )


def downgrade():
    op.drop_table(
        "system_manuals",
    )
