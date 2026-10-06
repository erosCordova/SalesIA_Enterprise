from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles

from app.schemas.commercial import (
    SaleCancelRequest,
    SaleCreateRequest,
    SaleCreatedResponse,
    SaleListItem,
    SaleViewResponse,
)

from app.services.commercial import (
    cancel_sale,
    create_sale,
    get_sale_detail,
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


@router.get(
    "/{sale_id}",
    response_model=SaleViewResponse,
    summary="Consultar detalle de venta",
)
def sale_detail(
    sale_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return get_sale_detail(
        sale_id,
        current_user,
    )


@router.patch(
    "/{sale_id}/cancel",
    response_model=SaleViewResponse,
    summary="Anular venta",
)
def sale_cancel(
    sale_id: UUID,
    data: SaleCancelRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    return cancel_sale(
        sale_id,
        data.reason,
        current_user,
    )
