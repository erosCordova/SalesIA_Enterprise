from fastapi import (
    APIRouter,
    Depends,
)

from app.services.insights import generate_insights

from app.api.dependencies.auth import require_roles
from app.schemas.reporting import InsightListItem
from app.services.reporting import get_insights


router = APIRouter()


@router.get(
    "",
    response_model=list[InsightListItem],
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
    response_model=list[InsightListItem],
    summary="Generar insights empresariales",
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
    return generate_insights(current_user)