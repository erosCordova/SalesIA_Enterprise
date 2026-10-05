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
    
from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


ReportType = Literal[
    "sales",
    "statistical",
    "products",
    "customers",
    "employees",
]


class ReportGenerateRequest(BaseModel):
    report_type: ReportType

    start_date: date | None = None
    end_date: date | None = None

    employee_id: UUID | None = None
    category_id: UUID | None = None

    name: str | None = Field(
        default=None,
        max_length=150,
    )

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, value):
        if isinstance(value, str):
            value = value.strip() or None
        return value

    @model_validator(mode="after")
    def validate_date_range(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.start_date > self.end_date
        ):
            raise ValueError(
                "La fecha inicial no puede ser posterior a la fecha final."
            )
        return self

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
