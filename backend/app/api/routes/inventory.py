from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import InventoryItemResponse
from app.services.commercial import get_inventory


router = APIRouter()


@router.get(
    "",
    response_model=list[InventoryItemResponse],
    summary="Consultar inventario",
)
def list_inventory(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return get_inventory(
        current_user
    )


@router.get(
    "/status",
    summary="Estado del módulo de inventario",
)
def inventory_status(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return {
        "module": "Gestión de Inventario",
        "status": "ready",
    }
