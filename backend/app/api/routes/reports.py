from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.reporting import ReportListItem
from app.services.reporting import get_reports


router = APIRouter()


@router.get(
    "",
    response_model=list[ReportListItem],
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
        "module": "Reportes",
        "status": "ready",
    }
