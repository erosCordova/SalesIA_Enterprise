from decimal import Decimal

from fastapi import HTTPException, status

from app.core.database import engine

from app.repositories import inventory as repository

from app.schemas.inventory import (
    InventoryMovementCreateRequest,
    InventoryMovementResponse,
)


def get_inventory_movements(
    current_user: dict,
) -> list[InventoryMovementResponse]:
    with engine.connect() as connection:
        rows = repository.list_inventory_movements(
            connection,
            current_user["company_id"],
        )

    return [
        InventoryMovementResponse(
            **dict(row)
        )
        for row in rows
    ]


def create_inventory_movement(
    data: InventoryMovementCreateRequest,
    current_user: dict,
) -> InventoryMovementResponse:
    company_id = current_user["company_id"]

    quantity = Decimal(
        str(data.quantity)
    )

    reason = data.reason.strip()

    with engine.begin() as connection:
        inventory = (
            repository.get_inventory_for_update(
                connection,
                company_id,
                data.product_id,
            )
        )

        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "El producto no tiene "
                    "inventario registrado."
                ),
            )

        current_stock = Decimal(
            str(
                inventory[
                    "stock_quantity"
                ]
            )
        )

        if data.movement_type == "entry":
            new_stock = (
                current_stock
                + quantity
            )
        else:
            new_stock = (
                current_stock
                - quantity
            )

        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "La salida supera el "
                    "stock disponible."
                ),
            )

        repository.update_inventory_stock(
            connection,
            inventory[
                "inventory_id"
            ],
            new_stock,
        )

        movement = (
            repository.insert_manual_movement(
                connection,
                company_id=company_id,
                inventory_id=inventory[
                    "inventory_id"
                ],
                product_id=inventory[
                    "product_id"
                ],
                user_id=current_user["id"],
                movement_type=(
                    data.movement_type
                ),
                quantity=quantity,
                reason=reason,
            )
        )

    full_name = " ".join(
        value
        for value in [
            current_user.get(
                "first_name"
            ),
            current_user.get(
                "last_name"
            ),
        ]
        if value
    ).strip()

    return InventoryMovementResponse(
        id=movement["id"],
        inventory_id=inventory[
            "inventory_id"
        ],
        product_id=inventory[
            "product_id"
        ],
        sku=inventory["sku"],
        product_name=inventory[
            "product_name"
        ],
        user_id=current_user["id"],
        user_name=(
            full_name
            or "Usuario"
        ),
        movement_type=(
            data.movement_type
        ),
        quantity=quantity,
        reference_type="manual",
        reference_id=None,
        reference_label=(
            "Movimiento manual"
        ),
        reason=reason,
        movement_date=movement[
            "movement_date"
        ],
    )
