from fastapi import APIRouter

from app.api.routes import (
    analytics,
    audit,
    auth,
    commercial,
    dashboard,
    inventory,
    reports,
    users,
)


api_router = APIRouter()


api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Autenticación"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Usuarios"],
)

api_router.include_router(
    commercial.router,
    prefix="/commercial",
    tags=["Gestión Comercial"],
)

api_router.include_router(
    inventory.router,
    prefix="/inventory",
    tags=["Inventario"],
)

api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"],
)

api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reportes"],
)

api_router.include_router(
    audit.router,
    prefix="/audit",
    tags=["Auditoría"],
)
