from fastapi import (
    APIRouter,
    Depends,
    Request,
    status,
)

from app.api.dependencies.auth import (
    require_roles,
)
from app.services.audit import (
    record_audit_event,
    snapshot,
)

from app.schemas.commercial import (
    InventoryItemResponse,
)

from app.schemas.inventory import (
    InventoryMovementCreateRequest,
    InventoryMovementResponse,
)

from app.services.commercial import (
    get_inventory,
)

from app.services.inventory import (
    create_inventory_movement,
    get_inventory_movements,
)


router = APIRouter()


INVENTORY_ROLES = (
    "Administrador",
    "Gerente",
    "Almacén",
)


@router.get(
    "",
    response_model=list[InventoryItemResponse],
    summary="Consultar inventario",
)
def list_inventory(
    current_user: dict = Depends(
        require_roles(
            *INVENTORY_ROLES
        )
    ),
):
    return get_inventory(
        current_user
    )


@router.get(
    "/movements",
    response_model=list[
        InventoryMovementResponse
    ],
    summary="Consultar Kardex",
)
def list_movements(
    current_user: dict = Depends(
        require_roles(
            *INVENTORY_ROLES
        )
    ),
):
    return get_inventory_movements(
        current_user
    )


@router.post(
    "/movements",
    response_model=InventoryMovementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar movimiento manual de inventario",
)
def register_movement(
    request: Request,
    data: InventoryMovementCreateRequest,
    current_user: dict = Depends(
        require_roles(
            *INVENTORY_ROLES
        )
    ),
):
    result = create_inventory_movement(
        data,
        current_user,
    )

    movement_type = str(
        getattr(
            result,
            "movement_type",
            "movement",
        )
    ).lower()

    action = (
        f"inventory.{movement_type}"
        if movement_type
        in {
            "entry",
            "exit",
            "adjustment",
        }
        else "inventory.movement"
    )

    record_audit_event(
        action=action,
        table_name="inventory_movements",
        record_id=getattr(
            result,
            "id",
            None,
        ),
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result


@router.get(
    "/status",
    summary="Estado del módulo de inventario",
)
def inventory_status():
    return {
        "module": "Gestión de Inventario",
        "status": "ready",
    }
