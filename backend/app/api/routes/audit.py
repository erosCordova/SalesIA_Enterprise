from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.api.dependencies.auth import require_roles
from app.core.database import engine
from app.services.audit import list_company_audit_events


router = APIRouter()


@router.get(
    "",
    summary="Consultar acciones críticas",
    description="Devuelve las acciones críticas recientes de la empresa del usuario.",
)
def audit_events(
    limit: int = Query(default=100, ge=1, le=100),
    current_user: dict = Depends(
        require_roles("Administrador", "Gerente")
    ),
):
    with engine.connect() as connection:
        return list_company_audit_events(
            connection,
            current_user["company_id"],
            limit,
        )


@router.get(
    "/status",
    summary="Estado del módulo de auditoría",
)
def audit_status(
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    return {
        "module": "Auditoría y Trazabilidad",
        "status": "ready",
    }
