
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_current_user
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard import dashboard_summary

router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Resumen ejecutivo",
)
def get_dashboard_summary(
    current_user: dict = Depends(get_current_user),
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