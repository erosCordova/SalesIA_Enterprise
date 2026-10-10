from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Request,
    status,
)

from app.api.dependencies.auth import require_roles
from app.services.audit import (
    record_audit_event,
    snapshot,
)

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
    branch_id: UUID | None = None,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return get_sales(
        current_user,
        branch_id=branch_id,
    )


@router.post(
    "",
    response_model=SaleCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar venta",
)
def register_sale(
    request: Request,
    data: SaleCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Vendedor",
        )
    ),
):
    result = create_sale(
        data,
        current_user,
    )

    record_audit_event(
        action="sale.created",
        table_name="sales",
        record_id=result.id,
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result


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
    request: Request,
    sale_id: UUID,
    data: SaleCancelRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    before = get_sale_detail(
        sale_id,
        current_user,
    )

    result = cancel_sale(
        sale_id,
        data.reason,
        current_user,
    )

    record_audit_event(
        action="sale.cancelled",
        table_name="sales",
        record_id=sale_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result
