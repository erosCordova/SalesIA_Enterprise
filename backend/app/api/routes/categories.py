from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.commercial import (
    CategoryCreateRequest,
    CategoryResponse,
)
from app.services.commercial import (
    create_category,
    get_categories,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="Listar categorías",
)
def list_categories(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Almacén",
        )
    ),
):
    return get_categories(
        current_user
    )


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear categoría",
)
def register_category(
    data: CategoryCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    return create_category(
        data,
        current_user,
    )
