from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


InventoryMovementType = Literal[
    "entry",
    "exit",
]


class InventoryMovementCreateRequest(BaseModel):
    product_id: UUID

    movement_type: InventoryMovementType

    quantity: Decimal = Field(
        ...,
        gt=0,
    )

    reason: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )


class InventoryMovementResponse(BaseModel):
    id: UUID

    inventory_id: UUID
    product_id: UUID

    sku: str
    product_name: str

    user_id: UUID | None
    user_name: str

    movement_type: str
    quantity: Decimal

    reference_type: str | None
    reference_id: UUID | None
    reference_label: str | None

    reason: str | None

    movement_date: datetime
