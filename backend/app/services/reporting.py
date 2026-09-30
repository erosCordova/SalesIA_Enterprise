from app.core.database import engine
from app.repositories.reporting import (
    list_insights,
    list_reports,
)
from app.schemas.reporting import (
    InsightListItem,
    ReportListItem,
)


def get_insights(
    current_user: dict,
) -> list[InsightListItem]:
    with engine.connect() as connection:
        rows = list_insights(
            connection,
            current_user["company_id"],
        )

    return [
        InsightListItem(**dict(row))
        for row in rows
    ]


def get_reports(
    current_user: dict,
) -> list[ReportListItem]:
    with engine.connect() as connection:
        rows = list_reports(
            connection,
            current_user["company_id"],
        )

    return [
        ReportListItem(**dict(row))
        for row in rows
    ]
