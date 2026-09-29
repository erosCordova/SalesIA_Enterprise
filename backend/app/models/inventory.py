from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    CreatedAtMixin,
    UUIDPrimaryKeyMixin,
)


class Inventory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "inventory"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    product_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False,
    )

    stock_quantity: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    minimum_stock: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    maximum_stock: Mapped[Decimal | None] = mapped_column(
        Numeric
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class InventoryMovement(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "inventory_movements"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    inventory_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("inventory.id"),
        nullable=False,
    )

    product_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False,
    )

    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
    )

    movement_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    reference_type: Mapped[str | None] = mapped_column(
        String
    )

    reference_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True)
    )

    reason: Mapped[str | None] = mapped_column(Text)

    movement_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
