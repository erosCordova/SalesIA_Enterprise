from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles


router = APIRouter()


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