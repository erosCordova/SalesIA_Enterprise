from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel


BusinessReportType = Literal[
    "sales",
    "branches",
    "products",
    "customers",
    "inventory",
    "kardex",
]


class BusinessReportSummaryItem(BaseModel):
    key: str
    label: str
    value: int | float | str
    format: str = "text"


class BusinessReportColumn(BaseModel):
    key: str
    label: str
    format: str = "text"


class BusinessReportResponse(BaseModel):
    report_type: BusinessReportType

    title: str
    description: str

    branch_id: UUID | None
    branch_name: str

    start_date: date
    end_date: date

    generated_at: datetime

    summary: list[
        BusinessReportSummaryItem
    ]

    columns: list[
        BusinessReportColumn
    ]

    rows: list[
        dict[str, Any]
    ]
