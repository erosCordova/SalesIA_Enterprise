"""create branches table corrective

Revision ID: f06b001
Revises: fc127d36f00c
Create Date: 2026-09-30 13:41:09.138599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql



# revision identifiers, used by Alembic.
revision: str = 'f06b001'
down_revision: Union[str, Sequence[str], None] = 'fc127d36f00c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "branches",

        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text(
                "gen_random_uuid()"
            ),
        ),

        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "code",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(length=150),
            nullable=False,
        ),

        sa.Column(
            "address",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "city",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "country",
            sa.String(length=100),
            nullable=True,
            server_default="Perú",
        ),

        sa.Column(
            "phone",
            sa.String(length=30),
            nullable=True,
        ),

        sa.Column(
            "email",
            sa.String(length=200),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="active",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.CheckConstraint(
            "status IN ('active', 'inactive')",
            name="chk_branch_status",
        ),

        sa.ForeignKeyConstraint(
            ["company_id"],
            ["companies.id"],
            name="fk_branches_company",
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id",
            name="branches_pkey",
        ),

        sa.UniqueConstraint(
            "company_id",
            "code",
            name="uq_branch_company_code",
        ),
    )

    op.create_index(
        "ix_branches_company_id",
        "branches",
        ["company_id"],
        unique=False,
    )

    op.create_index(
        "ix_branches_company_status",
        "branches",
        [
            "company_id",
            "status",
        ],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_branches_company_status",
        table_name="branches",
    )

    op.drop_index(
        "ix_branches_company_id",
        table_name="branches",
    )

    op.drop_table(
        "branches",
    )
