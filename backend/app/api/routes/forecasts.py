from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.api.dependencies.auth import require_roles
from app.schemas.forecasting import SalesForecastResponse
from app.services.forecasting import get_sales_forecast


router = APIRouter()


@router.get(
    "/sales",
    response_model=SalesForecastResponse,
    summary="Pronosticar ventas",
)
def sales_forecast(
    horizon_days: int = Query(
        default=30,
        ge=7,
        le=90,
    ),

    history_days: int = Query(
        default=90,
        ge=14,
        le=365,
    ),

    branch_id: UUID | None = None,

    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return get_sales_forecast(
        current_user=current_user,
        horizon_days=horizon_days,
        history_days=history_days,
        branch_id=branch_id,
    )
