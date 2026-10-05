from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import (
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
)
from app.services.commercial import (
    create_product,
    delete_product,
    get_product,
    get_products,
    update_product,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="Listar productos",
)
def list_products(
    search: str | None = Query(default=None, max_length=100),
    category_id: UUID | None = None,
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
        current_user,
        search,
        category_id,
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


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Obtener producto",
)
def read_product(
    product_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Almacén",
        )
    ),
):
    return get_product(
        product_id,
        current_user,
    )


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Actualizar producto",
)
def edit_product(
    product_id: UUID,
    data: ProductUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return update_product(
        product_id,
        data,
        current_user,
    )


@router.delete(
    "/{product_id}",
    summary="Desactivar producto",
)
def remove_product(
    product_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return delete_product(
        product_id,
        current_user,
    )
