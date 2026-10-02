from fastapi import (
    APIRouter,
    Depends,
    status,HTTPException,
)
from uuid import UUID
from app.api.dependencies.auth import require_roles, get_current_user
from app.schemas.commercial import (
    CustomerCreateRequest,
    CustomerResponse, CustomerUpdateRequest
)
from app.services.commercial import (
    create_customer,
    get_customers, update_customer as update_customer_service, get_customer_history,
)


router = APIRouter()


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer_endpoint(
    customer_id: UUID,
    data: CustomerUpdateRequest,
    current_user: dict = Depends(get_current_user),
    _role=Depends(
        require_roles("Administrador", "Gerente", "Vendedor")
    ),
):
    return update_customer_service(
        customer_id,
        data,
        current_user,
    )


@router.get("/{customer_id}/history")
def customer_history_endpoint(
    customer_id: UUID,
    current_user: dict = Depends(get_current_user),
    _role=Depends(
        require_roles("Administrador", "Gerente", "Vendedor")
    ),
):
    return get_customer_history(
        customer_id,
        current_user,
    )

@router.get(
    "",
    response_model=list[CustomerResponse],
    summary="Listar clientes",
    description=(
        "Lista los clientes pertenecientes "
        "a la empresa del usuario autenticado."
    ),
)
def list_customers(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return get_customers(
        current_user
    )


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cliente",
)
def register_customer(
    data: CustomerCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
        )
    ),
):
    return create_customer(
        data,
        current_user,
    )
