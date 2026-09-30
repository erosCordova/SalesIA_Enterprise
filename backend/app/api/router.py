from fastapi import APIRouter

from app.api.routes import (
    analytics,
    audit,
    auth,
    branches,
    company,
    categories,
    commercial,
    customers,
    dashboard,
    insights,
    inventory,
    probability,
    products,
    random_variables,
    reports,
    sales,
    statistics,
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
    company.router,
    prefix="/company",
    tags=["Empresa"],
)

api_router.include_router(
    branches.router,
    prefix="/branches",
    tags=["Sucursales"],
)

api_router.include_router(
    customers.router,
    prefix="/customers",
    tags=["Clientes"],
)

api_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categorías"],
)

api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Productos"],
)

api_router.include_router(
    sales.router,
    prefix="/sales",
    tags=["Ventas"],
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
    statistics.router,
    prefix="/statistics",
    tags=["Estadística"],
)

api_router.include_router(
    probability.router,
    prefix="/probability",
    tags=["Probabilidad"],
)

api_router.include_router(
    random_variables.router,
    prefix="/random-variables",
    tags=["Variables Aleatorias"],
)

api_router.include_router(
    insights.router,
    prefix="/insights",
    tags=["Insights"],
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
