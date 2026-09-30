from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import (
    CustomerCreateRequest,
    CustomerResponse,
)
from app.services.commercial import (
    create_customer,
    get_customers,
)


router = APIRouter()


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
