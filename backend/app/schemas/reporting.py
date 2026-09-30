from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
