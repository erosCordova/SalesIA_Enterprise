
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import require_roles
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard import dashboard_summary

router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Resumen ejecutivo",
)
def get_dashboard_summary(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Vendedor",
            "Analista",
            "Almacén",
        )
    ),
):
    return dashboard_summary(current_user)


@router.get(
    "/status",
    summary="Estado del dashboard",
)
def dashboard_status():
    return {
        "module": "Dashboard Ejecutivo",
        "status": "ready",
    }