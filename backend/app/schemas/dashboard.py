from decimal import Decimal

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    sales_count: int
    revenue: Decimal
    average_ticket: Decimal

    active_customers: int
    products_count: int
    low_stock_count: int

    scope: str
