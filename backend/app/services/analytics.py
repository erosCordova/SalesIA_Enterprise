
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.database import engine
from app.schemas.reporting import (
    AnalyticsDashboardResponse,
    AnalyticsSummary,
    DailySalesItem,
)


def get_analytics_dashboard(
    current_user: dict,
    start_date: date | None = None,
    end_date: date | None = None,
) -> AnalyticsDashboardResponse:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La fecha inicial no puede ser posterior a la fecha final.",
        )

    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": current_user["company_id"],
    }

    # Límites explícitos en UTC para evitar ambigüedades
    # al filtrar columnas TIMESTAMP WITH TIME ZONE.
    if start_date:
        filters.append("s.sale_date >= :start_datetime")
        params["start_datetime"] = datetime.combine(
            start_date, time.min, tzinfo=timezone.utc
        )

    if end_date:
        filters.append("s.sale_date < :end_datetime")
        params["end_datetime"] = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )

    where_clause = " AND ".join(filters)

    summary_sql = text(f"""
        SELECT
            COUNT(*) AS total_sales,
            COALESCE(SUM(s.total), 0) AS total_revenue,
            COALESCE(AVG(s.total), 0) AS average_ticket,
            COALESCE(
                percentile_cont(0.5)
                WITHIN GROUP (ORDER BY s.total),
                0
            ) AS median_ticket
        FROM public.sales AS s
        WHERE {where_clause}
    """)

    daily_sql = text(f"""
        SELECT
            (s.sale_date AT TIME ZONE 'UTC')::date AS sale_day,
            COUNT(*) AS sales_count,
            COALESCE(SUM(s.total), 0) AS revenue
        FROM public.sales AS s
        WHERE {where_clause}
        GROUP BY (s.sale_date AT TIME ZONE 'UTC')::date
        ORDER BY sale_day
    """)

    with engine.connect() as connection:
        summary_row = connection.execute(
            summary_sql, params
        ).mappings().one()

        daily_rows = connection.execute(
            daily_sql, params
        ).mappings().all()

    summary = AnalyticsSummary(
        total_sales=int(summary_row["total_sales"]),
        total_revenue=Decimal(str(summary_row["total_revenue"])),
        average_ticket=Decimal(str(summary_row["average_ticket"])),
        median_ticket=Decimal(str(summary_row["median_ticket"])),
    )

    daily_sales = [
        DailySalesItem(
            date=row["sale_day"],
            sales_count=int(row["sales_count"]),
            revenue=Decimal(str(row["revenue"])),
        )
        for row in daily_rows
    ]

    return AnalyticsDashboardResponse(
        start_date=start_date,
        end_date=end_date,
        summary=summary,
        daily_sales=daily_sales,
    )


def get_completed_sale_totals(
    current_user: dict,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[float]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La fecha inicial no puede ser posterior a la fecha final.",
        )

    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": current_user["company_id"],
    }

    if start_date:
        filters.append("s.sale_date >= :start_datetime")
        params["start_datetime"] = datetime.combine(
            start_date, time.min, tzinfo=timezone.utc
        )

    if end_date:
        filters.append("s.sale_date < :end_datetime")
        params["end_datetime"] = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT s.total
        FROM public.sales AS s
        WHERE {where_clause}
        ORDER BY s.sale_date
    """)

    with engine.connect() as connection:
        rows = connection.execute(query, params).scalars().all()

    return [float(value) for value in rows]