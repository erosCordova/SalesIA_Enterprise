from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class BusinessInsightMetric(BaseModel):
    label: str
    value: str


class BusinessInsightItem(BaseModel):
    id: str

    category: str
    severity: str

    title: str
    description: str
    reason: str

    action_label: str
    action_path: str

    metrics: list[BusinessInsightMetric]


class BusinessInsightsResponse(BaseModel):
    branch_id: UUID | None
    branch_name: str

    period_start: date
    period_end: date

    comparison_start: date
    comparison_end: date

    generated_at: datetime

    current_sales: int
    current_revenue: float
    current_average_ticket: float
    active_days: int

    insights: list[BusinessInsightItem]
