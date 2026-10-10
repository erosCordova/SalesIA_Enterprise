from fastapi import APIRouter

from app.api.routes import auth, branches, categories, commercial, company, customers, customer_accounts, dashboard, insights, inventory, products, reports, sales, users, analytics, audit, statistics, probability, random_variables, manuals, forecasts, business_statistics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(branches.router, prefix="/branches", tags=["Sucursales"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categorías"])
api_router.include_router(commercial.router, prefix="/commercial", tags=["Comercial"])
api_router.include_router(company.router, prefix="/company", tags=["Empresa"])
api_router.include_router(customers.router, prefix="/customers", tags=["Clientes"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(insights.router, prefix="/insights", tags=["Insights"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventario"])
api_router.include_router(products.router, prefix="/products", tags=["Productos"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reportes"])
api_router.include_router(sales.router, prefix="/sales", tags=["Ventas"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["Pronósticos"])
api_router.include_router(audit.router, prefix="/audit", tags=["Auditoría"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["Estadística"])
api_router.include_router(business_statistics.router, prefix="/statistics", tags=["Estadísticas"])
api_router.include_router(probability.router, prefix="/probability", tags=["Probabilidad"])
api_router.include_router(random_variables.router, prefix="/random-variables", tags=["Variables Aleatorias"])
api_router.include_router(manuals.router, prefix="/manuals", tags=["Manuales"])
api_router.include_router(customer_accounts.router, prefix="/customer-accounts", tags=["Acceso de Clientes"])
