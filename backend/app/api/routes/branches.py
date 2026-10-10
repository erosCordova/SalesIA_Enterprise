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
    request: Request,
    data: BranchCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    result = create_branch(
        data,
        current_user,
    )

    record_audit_event(
        action="branch.created",
        table_name="branches",
        record_id=result.id,
        current_user=current_user,
        request=request,
        new_data=snapshot(result),
    )

    return result


@router.patch(
    "/{branch_id}",
    response_model=BranchResponse,
    summary="Actualizar sucursal",
)
def modify_branch(
    request: Request,
    branch_id: UUID,
    data: BranchUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    before = next(
        (
            item
            for item in get_branches(
                current_user
            )
            if str(item.id)
            == str(branch_id)
        ),
        None,
    )

    result = update_branch(
        branch_id,
        data,
        current_user,
    )

    record_audit_event(
        action="branch.updated",
        table_name="branches",
        record_id=branch_id,
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result
