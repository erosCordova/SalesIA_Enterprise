from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class Company(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    business_name: Mapped[str | None] = mapped_column(
        String
    )

    tax_id: Mapped[str | None] = mapped_column(
        String
    )

    email: Mapped[str | None] = mapped_column(
        String
    )

    phone: Mapped[str | None] = mapped_column(
        String
    )

    address: Mapped[str | None] = mapped_column(
        Text
    )

    city: Mapped[str | None] = mapped_column(
        String
    )

    country: Mapped[str | None] = mapped_column(
        String
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
        unique=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text
    )

    permissions: Mapped[dict | None] = mapped_column(
        JSONB
    )


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "dni ~ '^[0-9]{8}$'",
            name="ck_users_dni_format",
        ),
    )

    # Identificador de Supabase Auth.
    # auth.users pertenece a otro esquema, por eso
    # no se declara como ForeignKey de PostgreSQL.
    auth_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
    )

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    role_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    # El DNI será el identificador utilizado
    # por los usuarios para iniciar sesión.
    dni: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        unique=True,
    )

    first_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # El correo se utiliza internamente para Supabase Auth.
    # El usuario no necesita escribirlo para iniciar sesión.
    email: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
