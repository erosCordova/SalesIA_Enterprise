from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.api.dependencies.auth import require_roles
from app.schemas.organization import (
    BranchCreateRequest,
    BranchResponse,
    BranchUpdateRequest,
)
from app.services.organization import (
    create_branch,
    get_branches,
    update_branch,
)


router = APIRouter()


@router.get(
    "",
    response_model=list[BranchResponse],
    summary="Listar sucursales",
)
def list_company_branches(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Analista",
        )
    ),
):
    return get_branches(
        current_user
    )


@router.post(
    "",
    response_model=BranchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sucursal",
)
def register_branch(
    data: BranchCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    return create_branch(
        data,
        current_user,
    )


@router.patch(
    "/{branch_id}",
    response_model=BranchResponse,
    summary="Actualizar sucursal",
)
def modify_branch(
    branch_id: UUID,
    data: BranchUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    return update_branch(
        branch_id,
        data,
        current_user,
    )
