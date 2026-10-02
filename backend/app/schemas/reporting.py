from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from datetime import date
from decimal import Decimal


class InsightListItem(BaseModel):
    id: UUID
    title: str
    description: str

    insight_type: str | None
    severity: str | None
    evidence: dict | None

    status: str
    created_at: datetime


class ReportListItem(BaseModel):
    id: UUID

    name: str
    report_type: str

    parameters: dict | None
    file_url: str | None

    status: str
    created_at: datetime

class AnalyticsSummary(BaseModel):
    total_sales: int
    total_revenue: Decimal
    average_ticket: Decimal
    median_ticket: Decimal


class DailySalesItem(BaseModel):
    date: date
    sales_count: int
    revenue: Decimal


class AnalyticsDashboardResponse(BaseModel):
    start_date: date | None
    end_date: date | None
    summary: AnalyticsSummary
    daily_sales: list[DailySalesItem]