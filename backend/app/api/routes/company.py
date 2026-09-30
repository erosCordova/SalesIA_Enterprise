from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
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
    data: CompanyUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
        )
    ),
):
    return update_current_company(
        data,
        current_user,
    )
