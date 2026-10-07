from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.api.dependencies.auth import (
    require_roles,
)

from app.schemas.audit import (
    AuditLogItem,
)

from app.services.audit import (
    get_audit_logs,
)


router = APIRouter()


@router.get(
    "/logs",
    response_model=list[
        AuditLogItem
    ],
    summary="Consultar registros de auditoría",
)
def list_logs(
    limit: int = Query(
        default=500,
        ge=1,
        le=1000,
    ),
    current_user: dict = Depends(
        require_roles(
            "Administrador"
        )
    ),
):
    return get_audit_logs(
        current_user=current_user,
        limit=limit,
    )


@router.get(
    "/status",
    summary="Estado del módulo de auditoría",
)
def audit_status():
    return {
        "module":
            "Auditoría y Trazabilidad",
        "status":
            "ready",
    }
