
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import text

from app.core.database import engine
from app.repositories.reporting import create_insight_if_missing
from app.schemas.reporting import InsightListItem


THRESHOLD = Decimal("20")


def percentage_change(
    current: Decimal,
    previous: Decimal,
) -> Decimal | None:
    if previous <= 0:
        return None

    return (
        (current - previous) / previous * Decimal("100")
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def generate_insights(
    current_user: dict,
) -> list[InsightListItem]:
    company_id = current_user["company_id"]

    query = text("""
        SELECT
            COALESCE(
                SUM(total) FILTER (
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '6 days'
                      AND sale_date < CURRENT_DATE + INTERVAL '1 day'
                ),
                0
            ) AS current_revenue,

            COUNT(*) FILTER (
                WHERE sale_date >= CURRENT_DATE - INTERVAL '6 days'
                  AND sale_date < CURRENT_DATE + INTERVAL '1 day'
            ) AS current_sales,

            COALESCE(
                AVG(total) FILTER (
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '6 days'
                      AND sale_date < CURRENT_DATE + INTERVAL '1 day'
                ),
                0
            ) AS current_ticket,

            COALESCE(
                SUM(total) FILTER (
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '13 days'
                      AND sale_date < CURRENT_DATE - INTERVAL '6 days'
                ),
                0
            ) AS previous_revenue,

            COUNT(*) FILTER (
                WHERE sale_date >= CURRENT_DATE - INTERVAL '13 days'
                  AND sale_date < CURRENT_DATE - INTERVAL '6 days'
            ) AS previous_sales,

            COALESCE(
                AVG(total) FILTER (
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '13 days'
                      AND sale_date < CURRENT_DATE - INTERVAL '6 days'
                ),
                0
            ) AS previous_ticket

        FROM sales
        WHERE company_id = :company_id
          AND status = 'completed'
          AND sale_date >= CURRENT_DATE - INTERVAL '13 days'
          AND sale_date < CURRENT_DATE + INTERVAL '1 day'
    """)

    generated: list[InsightListItem] = []

    with engine.begin() as connection:
        row = connection.execute(
            query,
            {"company_id": company_id},
        ).mappings().one()

        current_revenue = Decimal(str(row["current_revenue"]))
        previous_revenue = Decimal(str(row["previous_revenue"]))
        current_ticket = Decimal(str(row["current_ticket"]))
        previous_ticket = Decimal(str(row["previous_ticket"]))

        revenue_change = percentage_change(
            current_revenue,
            previous_revenue,
        )

        if revenue_change is not None:
            if revenue_change >= THRESHOLD:
                title = "Aumento de ingresos semanales"
                description = (
                    f"Los ingresos aumentaron un "
                    f"{revenue_change}% frente a los siete días anteriores."
                )
                severity = "low"
            elif revenue_change <= -THRESHOLD:
                title = "Disminución de ingresos semanales"
                description = (
                    f"Los ingresos disminuyeron un "
                    f"{abs(revenue_change)}% frente a los siete días anteriores."
                )
                severity = "high"
            else:
                title = None

            if title:
                evidence = {
                    "rule": "weekly_revenue_change",
                    "threshold_percent": str(THRESHOLD),
                    "current_period": "últimos 7 días, incluido hoy",
                    "previous_period": "7 días anteriores",
                    "current_revenue": str(current_revenue),
                    "previous_revenue": str(previous_revenue),
                    "change_percent": str(revenue_change),
                    "current_sales": row["current_sales"],
                    "previous_sales": row["previous_sales"],
                }

                saved = create_insight_if_missing(
                    connection=connection,
                    company_id=company_id,
                    title=title,
                    description=description,
                    insight_type="sales_trend",
                    severity=severity,
                    evidence=evidence,
                )

                generated.append(
                    InsightListItem(**dict(saved))
                )

        ticket_change = percentage_change(
            current_ticket,
            previous_ticket,
        )

        if (
            ticket_change is not None
            and row["current_sales"] > 0
            and row["previous_sales"] > 0
            and abs(ticket_change) >= THRESHOLD
        ):
            direction = (
                "aumentó" if ticket_change > 0 else "disminuyó"
            )

            title = "Variación relevante del ticket promedio"
            description = (
                f"El ticket promedio {direction} un "
                f"{abs(ticket_change)}% frente a los siete días anteriores."
            )

            evidence = {
                "rule": "weekly_average_ticket_change",
                "threshold_percent": str(THRESHOLD),
                "current_ticket": str(current_ticket),
                "previous_ticket": str(previous_ticket),
                "change_percent": str(ticket_change),
                "current_sales": row["current_sales"],
                "previous_sales": row["previous_sales"],
            }

            saved = create_insight_if_missing(
                connection=connection,
                company_id=company_id,
                title=title,
                description=description,
                insight_type="ticket_variation",
                severity="medium",
                evidence=evidence,
            )

            generated.append(
                InsightListItem(**dict(saved))
            )

    return generated