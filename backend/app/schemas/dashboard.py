
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DashboardDailySalesItem(BaseModel):
    day: date
    sales: int
    revenue: Decimal


class DashboardRecentSaleItem(BaseModel):
    id: str
    sale_number: str
    customer_name: str
    sale_date: datetime | date | str
    total: Decimal
    status: str


class DashboardStockAlertItem(BaseModel):
    product_name: str
    stock_quantity: Decimal
    stock_status: str


class DashboardSummaryResponse(BaseModel):
    sales_count: int
    revenue: Decimal
    average_ticket: Decimal

    active_customers: int
    products_count: int
    low_stock_count: int

    growth_percentage: Decimal = Decimal("0")

    sales_by_day: list[DashboardDailySalesItem] = Field(
        default_factory=list
    )
    recent_sales: list[DashboardRecentSaleItem] = Field(
        default_factory=list
    )
    stock_alerts: list[DashboardStockAlertItem] = Field(
        default_factory=list
    )

    scope: str

