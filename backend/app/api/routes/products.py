from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Request,
    File,
    UploadFile,
    status,
)

from app.api.dependencies.auth import require_roles
from app.services.audit import (
    record_audit_event,
    snapshot,
)
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

from app.services.product_images import (
    upload_product_image as save_product_image,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="Listar productos",
)
def list_products(
    search: str | None = None,
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
    request: Request,
    data: ProductCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    result = create_product(
        data,
        current_user,
    )

    record_audit_event(
        action="product.created",
        table_name="products",
        record_id=result.id,
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result


@router.post(
    "/{product_id}/image",
    response_model=ProductResponse,
    summary="Subir imagen de producto",
)
def upload_product_image(
    request: Request,
    product_id: UUID,
    image: UploadFile = File(...),
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    before = get_product(
        product_id,
        current_user,
    )

    result = save_product_image(
        product_id,
        image,
        current_user,
    )

    record_audit_event(
        action="product.image_updated",
        table_name="products",
        record_id=product_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result


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
    request: Request,
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
    before = get_product(
        product_id,
        current_user,
    )

    result = update_product(
        product_id,
        data,
        current_user,
    )

    record_audit_event(
        action="product.updated",
        table_name="products",
        record_id=product_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result


@router.delete(
    "/{product_id}",
    summary="Desactivar producto",
)
def remove_product(
    request: Request,
    product_id: UUID,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Almacén",
        )
    ),
):
    before = get_product(
        product_id,
        current_user,
    )

    result = delete_product(
        product_id,
        current_user,
    )

    record_audit_event(
        action="product.deactivated",
        table_name="products",
        record_id=product_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result
