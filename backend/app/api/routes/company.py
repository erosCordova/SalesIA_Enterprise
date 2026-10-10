from fastapi import (
    APIRouter,
    Depends,
    Request,
)

from app.api.dependencies.auth import require_roles
from app.services.audit import (
    record_audit_event,
    snapshot,
)
from app.schemas.organization import (
    CompanyResponse,
    CompanyUpdateRequest,
)
from app.services.organization import (
    get_current_company,
    update_current_company,
)


router = APIRouter()


@router.get(
    "",
    response_model=CompanyResponse,
    summary="Consultar empresa",
)
def company_detail(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    return get_current_company(
        current_user
    )


@router.patch(
    "",
    response_model=CompanyResponse,
    summary="Actualizar empresa",
)
def company_update(
    request: Request,
    data: CompanyUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    before = get_current_company(
        current_user
    )

    result = update_current_company(
        data,
        current_user,
    )

    record_audit_event(
        action="company.updated",
        table_name="companies",
        record_id=current_user["company_id"],
        current_user=current_user,
        request=request,
        old_data=snapshot(before),
        new_data=snapshot(result),
    )

    return result
