from app.core.database import engine
from app.repositories.dashboard import get_summary
from app.schemas.dashboard import DashboardSummaryResponse


def dashboard_summary(
    current_user: dict,
) -> DashboardSummaryResponse:
    role = current_user["role"]

    sales_user_id = None
    include_sales = True

    scope = "company"

    if role == "Vendedor":
        sales_user_id = current_user["id"]
        scope = "user"

    if role == "Almacén":
        include_sales = False
        scope = "inventory"

    with engine.connect() as connection:
        result = get_summary(
            connection,
            company_id=current_user["company_id"],
            sales_user_id=sales_user_id,
            include_sales=include_sales,
        )
    
    return DashboardSummaryResponse(
        **result,
        scope=scope,
    )
