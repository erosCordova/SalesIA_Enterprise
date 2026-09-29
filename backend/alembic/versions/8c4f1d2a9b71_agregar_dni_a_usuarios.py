"""Agregar DNI a usuarios

Revision ID: 8c4f1d2a9b71
Revises: 36a85bd1e47f
Create Date: 2026-09-29

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c4f1d2a9b71"

down_revision: Union[str, None] = "36a85bd1e47f"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Primero se crea nullable para poder migrar
    # el usuario administrador que ya existe.
    op.add_column(
        "users",
        sa.Column(
            "dni",
            sa.String(length=8),
            nullable=True,
        ),
    )

    # El administrador inicial ya existe.
    # Le asignamos un DNI técnico de prueba.
    op.execute(
        """
        UPDATE users
        SET dni = '00000001'
        WHERE email = 'admin@salesia.com'
          AND dni IS NULL
        """
    )

    # Evitamos continuar si existiera algún usuario
    # sin DNI después de la actualización anterior.
    connection = op.get_bind()

    missing_dni = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM users
            WHERE dni IS NULL
            """
        )
    ).scalar_one()

    if missing_dni > 0:
        raise RuntimeError(
            "Existen usuarios sin DNI. "
            "Asigna un DNI antes de continuar."
        )

    op.alter_column(
        "users",
        "dni",
        existing_type=sa.String(length=8),
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_users_dni",
        "users",
        ["dni"],
    )

    op.create_check_constraint(
        "ck_users_dni_format",
        "users",
        "dni ~ '^[0-9]{8}$'",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_users_dni_format",
        "users",
        type_="check",
    )

    op.drop_constraint(
        "uq_users_dni",
        "users",
        type_="unique",
    )

    op.drop_column(
        "users",
        "dni",
    )
