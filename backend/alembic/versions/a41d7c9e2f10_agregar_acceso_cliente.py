"""agregar acceso de clientes

Revision ID: a41d7c9e2f10
Revises: f6c2a1d8e904
"""

from alembic import op
import sqlalchemy as sa

from sqlalchemy.dialects import postgresql


revision = "a41d7c9e2f10"
down_revision = "f6c2a1d8e904"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "customer_id",
            postgresql.UUID(
                as_uuid=True,
            ),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_users_customer_id_customers",
        "users",
        "customers",
        [
            "customer_id",
        ],
        [
            "id",
        ],
        ondelete="SET NULL",
    )

    op.create_unique_constraint(
        "uq_users_customer_id",
        "users",
        [
            "customer_id",
        ],
    )

    op.execute("""
        INSERT INTO roles (
            id,
            name,
            description,
            permissions,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            'Cliente',
            'Acceso restringido al portal del cliente.',
            '{"portal_cliente": true}'::jsonb,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1
            FROM roles
            WHERE name = 'Cliente'
        )
    """)


def downgrade():
    op.drop_constraint(
        "uq_users_customer_id",
        "users",
        type_="unique",
    )

    op.drop_constraint(
        "fk_users_customer_id_customers",
        "users",
        type_="foreignkey",
    )

    op.drop_column(
        "users",
        "customer_id",
    )
