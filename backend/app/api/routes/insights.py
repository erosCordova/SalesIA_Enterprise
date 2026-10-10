from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles

from app.schemas.business_insights import (
    BusinessInsightsResponse,
)
from app.schemas.reporting import (
    InsightListItem,
)

from app.services.business_insights import (
    get_business_insights,
)
from app.services.insights import (
    generate_insights,
)
from app.services.reporting import (
    get_insights,
)


router = APIRouter()


@router.get(
    "/business",
    response_model=
        BusinessInsightsResponse,
    summary=(
        "Consultar insights "
        "empresariales en tiempo real"
    ),
)
def business_insights(
    branch_id: UUID | None = None,

    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return get_business_insights(
        current_user=
            current_user,

        branch_id=
            branch_id,
    )


@router.get(
    "",
    response_model=
        list[InsightListItem],
    summary="Consultar insights",
)
def list_insights(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return get_insights(
        current_user
    )


@router.post(
    "/generate",
    response_model=
        list[InsightListItem],
    summary=(
        "Generar insights "
        "empresariales persistidos"
    ),
)
def generate_business_insights(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return generate_insights(
        current_user
    )
