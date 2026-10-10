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
    CategoryCreateRequest,
    CategoryResponse,
    CategoryUpdateRequest,
)

from app.services.commercial import (
    create_category,
    delete_category,
    get_categories,
    get_category,
    update_category,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="Listar categorías",
)
def list_categories(
    search: str | None = None,
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
        current_user,
        search,
    )


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear categoría",
)
def register_category(
    request: Request,
    data: CategoryCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    result = create_category(
        data,
        current_user,
    )

    record_audit_event(
        action="category.created",
        table_name="categories",
        record_id=result.id,
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Obtener categoría",
)
def read_category(
    category_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Almacén",
        )
    ),
):
    return get_category(
        category_id,
        current_user,
    )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Actualizar categoría",
)
def edit_category(
    request: Request,
    category_id: UUID,
    data: CategoryUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    before = get_category(
        category_id,
        current_user,
    )

    result = update_category(
        category_id,
        data,
        current_user,
    )

    record_audit_event(
        action="category.updated",
        table_name="categories",
        record_id=category_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result


@router.delete(
    "/{category_id}",
    summary="Desactivar categoría",
)
def remove_category(
    request: Request,
    category_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    before = get_category(
        category_id,
        current_user,
    )

    result = delete_category(
        category_id,
        current_user,
    )

    record_audit_event(
        action="category.deactivated",
        table_name="categories",
        record_id=category_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result
