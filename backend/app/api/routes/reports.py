from datetime import (
    date,
    timedelta,
)
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.business_reports import (
    BusinessReportResponse,
    BusinessReportType,
)
from app.schemas.reporting import (
    ReportListItem,
)
from app.services.business_reports import (
    get_business_report,
)
from app.services.reporting import (
    get_reports,
)


router = APIRouter()


@router.get(
    "/business",
    response_model=
        BusinessReportResponse,
    summary="Generar reporte empresarial",
)
def business_report(
    report_type:
        BusinessReportType =
            "sales",

    start_date:
        date | None = None,

    end_date:
        date | None = None,

    branch_id:
        UUID | None = None,

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

    return get_business_report(
        current_user=
            current_user,

        report_type=
            report_type,

        start_date=
            resolved_start,

        end_date=
            resolved_end,

        branch_id=
            branch_id,
    )


@router.get(
    "",
    response_model=
        list[ReportListItem],
    summary="Consultar reportes",
)
def list_reports(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return get_reports(
        current_user
    )


@router.get(
    "/status",
    summary="Estado del módulo de reportes",
)
def reports_status():
    return {
        "module":
            "Reportes",

        "status":
            "ready",
    }
