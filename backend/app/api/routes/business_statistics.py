from datetime import date, timedelta
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.business_statistics import (
    SalesBusinessStatisticsResponse,
)
from app.services.business_statistics import (
    get_sales_business_statistics,
)


router = APIRouter()


@router.get(
    "/sales-summary",
    response_model=
        SalesBusinessStatisticsResponse,
    summary=(
        "Consultar estadísticas "
        "descriptivas de ventas"
    ),
)
def sales_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    branch_id: UUID | None = None,

    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    resolved_end = (
        end_date
        or date.today()
    )

    resolved_start = (
        start_date
        or (
            resolved_end
            - timedelta(
                days=29
            )
        )
    )

    return (
        get_sales_business_statistics(
            current_user=
                current_user,

            start_date=
                resolved_start,

            end_date=
                resolved_end,

            branch_id=
                branch_id,
        )
    )
