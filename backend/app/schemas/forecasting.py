from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: date
    revenue: float
    sales: float


class SalesForecastResponse(BaseModel):
    branch_id: UUID | None
    branch_name: str

    history_start: date
    history_end: date

    history_days: int
    horizon_days: int

    observed_days: int
    active_days: int

    historical_revenue: float
    historical_sales: int

    average_daily_revenue: float
    average_ticket: float

    projected_revenue: float
    projected_sales: float
    projected_daily_revenue: float

    lower_bound: float
    upper_bound: float

    trend_percent: float
    trend_direction: str

    confidence_score: float
    confidence_label: str

    model_name: str
    interpretation: str

    historical: list[ForecastPoint]
    forecast: list[ForecastPoint]
