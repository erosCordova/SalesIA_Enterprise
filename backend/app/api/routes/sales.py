from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import (
    SaleCreateRequest,
    SaleCreatedResponse,
    SaleListItem,
)
from app.services.commercial import (
    create_sale,
    get_sales,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[SaleListItem],
    summary="Consultar ventas",
)
def list_sales(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return get_sales(
        current_user
    )


@router.post(
    "",
    response_model=SaleCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar venta",
    description=(
        "Registra la venta, detalle, pago, "
        "actualización de inventario y "
        "movimientos de stock dentro de "
        "una única transacción."
    ),
)
def register_sale(
    data: SaleCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Vendedor",
        )
    ),
):
    return create_sale(
        data,
        current_user,
    )
