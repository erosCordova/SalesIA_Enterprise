from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from supabase import create_client

from app.core.config import settings
from app.core.database import engine


bearer_scheme = HTTPBearer(
    auto_error=False,
)


DEFAULT_ROLE_PERMISSIONS = {
    "Administrador": {"*": True},
    "Gerente": {
        "reports.read": True,
        "reports.generate": True,
        "reports.download": True,
    },
    "Analista": {
        "reports.read": True,
        "reports.generate": True,
        "reports.download": True,
    },
}

PERMISSION_MESSAGES = {
    "reports.read": "consultar reportes",
    "reports.generate": "generar reportes",
    "reports.download": "descargar reportes",
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido.",
        )

    token = credentials.credentials

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY,
    )

    try:
        auth_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo identificar al usuario.",
        )

    auth_user_id = str(auth_response.user.id)

    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT
                    u.id,
                    u.auth_user_id,
                    u.company_id,
                    u.role_id,
                    u.dni,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.status,
                    r.name AS role,
                    r.permissions,
                    c.name AS company
                FROM users u
                INNER JOIN roles r
                    ON r.id = u.role_id
                INNER JOIN companies c
                    ON c.id = u.company_id
                WHERE u.auth_user_id = :auth_user_id
                LIMIT 1
            """),
            {
                "auth_user_id": auth_user_id,
            },
        ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no registrado en SalesIA Enterprise.",
        )

    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo.",
        )

    return dict(user)


def require_roles(
    *allowed_roles: str,
) -> Callable[[dict], dict]:
    def dependency(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción.",
            )

        return current_user

    return dependency


def require_permission(
    permission: str,
) -> Callable[[dict], dict]:
    def dependency(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        permissions = current_user.get("permissions")

        if permissions is None:
            permissions = DEFAULT_ROLE_PERMISSIONS.get(
                current_user.get("role"),
                {},
            )

        if not isinstance(permissions, dict):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Configuración de permisos inválida.",
            )

        # Administrador tiene acceso total.
        if permissions.get("*") is True:
            return current_user

        # Verificación del permiso específico.
        if permissions.get(permission) is not True:
            action = PERMISSION_MESSAGES.get(
                permission,
                "realizar esta acción",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para {action}.",
            )

        return current_user

    return dependency
