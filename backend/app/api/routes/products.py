from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import (
    ProductCreateRequest,
    ProductResponse,
)
from app.services.commercial import (
    create_product,
    get_products,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="Listar productos",
)
def list_products(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Almacén",
        )
    ),
):
    return get_products(
        current_user
    )


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear producto",
)
def register_product(
    data: ProductCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return create_product(
        data,
        current_user,
    )
