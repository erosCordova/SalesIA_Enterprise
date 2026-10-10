from datetime import date, timedelta
from math import sqrt
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.database import engine
from app.schemas.forecasting import (
    ForecastPoint,
    SalesForecastResponse,
)


def _linear_regression(
    values: list[float],
):
    count = len(values)

    if count == 0:
        return 0.0, 0.0, 0.0

    if count == 1:
        return 0.0, values[0], 0.0

    x_mean = (count - 1) / 2
    y_mean = sum(values) / count

    numerator = sum(
        (index - x_mean)
        * (value - y_mean)
        for index, value
        in enumerate(values)
    )

    denominator = sum(
        (index - x_mean) ** 2
        for index
        in range(count)
    )

    slope = (
        numerator / denominator
        if denominator
        else 0.0
    )

    intercept = (
        y_mean
        - slope * x_mean
    )

    total_variance = sum(
        (value - y_mean) ** 2
        for value in values
    )

    residual_variance = sum(
        (
            value
            - (
                intercept
                + slope * index
            )
        ) ** 2
        for index, value
        in enumerate(values)
    )

    r_squared = (
        max(
            0.0,
            min(
                1.0,
                1
                - (
                    residual_variance
                    / total_variance
                ),
            ),
        )
        if total_variance > 0
        else 0.0
    )

    return (
        slope,
        intercept,
        r_squared,
    )


def _confidence(
    *,
    observed_days: int,
    active_days: int,
    historical_sales: int,
    r_squared: float,
):
    if (
        observed_days <= 0
        or historical_sales <= 0
    ):
        return 0.0, "Insuficiente"

    history_factor = min(
        1.0,
        observed_days / 60,
    )

    sales_factor = min(
        1.0,
        historical_sales / 40,
    )

    activity_factor = min(
        1.0,
        active_days / 20,
    )

    score = (
        20
        + history_factor * 25
        + sales_factor * 20
        + activity_factor * 15
        + r_squared * 20
    )

    if historical_sales < 5:
        score = min(
            score,
            42,
        )

    if active_days < 3:
        score = min(
            score,
            38,
        )

    score = round(
        max(
            0,
            min(
                95,
                score,
            ),
        ),
        1,
    )

    if score >= 75:
        label = "Alta"
    elif score >= 50:
        label = "Media"
    else:
        label = "Baja"

    return score, label


def get_sales_forecast(
    *,
    current_user: dict,
    horizon_days: int,
    history_days: int,
    branch_id: UUID | None = None,
) -> SalesForecastResponse:

    company_id = (
        current_user["company_id"]
    )

    today = date.today()

    requested_start = (
        today
        - timedelta(
            days=history_days - 1,
        )
    )

    branch_name = (
        "Todas las sucursales"
    )

    with engine.connect() as connection:

        if branch_id is not None:
            branch = connection.execute(
                text("""
                    SELECT
                        id,
                        name,
                        status
                    FROM branches
                    WHERE id = :branch_id
                      AND company_id = :company_id
                    LIMIT 1
                """),
                {
                    "branch_id":
                        branch_id,

                    "company_id":
                        company_id,
                },
            ).mappings().first()

            if not branch:
                raise HTTPException(
                    status_code=
                        status.HTTP_404_NOT_FOUND,

                    detail=
                        "La sucursal seleccionada no existe.",
                )

            branch_name = (
                branch["name"]
            )

        query = """
            SELECT
                (
                    s.sale_date
                    AT TIME ZONE
                    'America/Lima'
                )::date
                    AS sale_day,

                COUNT(*)::int
                    AS sales_count,

                COALESCE(
                    SUM(s.total),
                    0
                ) AS revenue

            FROM sales s

            WHERE
                s.company_id =
                    :company_id

                AND s.status =
                    'completed'

                AND (
                    s.sale_date
                    AT TIME ZONE
                    'America/Lima'
                )::date
                    >= :history_start

                AND (
                    s.sale_date
                    AT TIME ZONE
                    'America/Lima'
                )::date
                    <= :history_end
        """

        parameters = {
            "company_id":
                company_id,

            "history_start":
                requested_start,

            "history_end":
                today,
        }

        if branch_id is not None:
            query += """
                AND s.branch_id =
                    :branch_id
            """

            parameters[
                "branch_id"
            ] = branch_id

        query += """
            GROUP BY sale_day
            ORDER BY sale_day
        """

        rows = connection.execute(
            text(query),
            parameters,
        ).mappings().all()

    row_map = {
        row["sale_day"]: {
            "revenue":
                float(
                    row["revenue"]
                    or 0
                ),

            "sales":
                int(
                    row["sales_count"]
                    or 0
                ),
        }
        for row in rows
    }

    if rows:
        first_sale_date = (
            rows[0]["sale_day"]
        )

        series_start = max(
            requested_start,
            first_sale_date,
        )
    else:
        series_start = (
            requested_start
        )

    historical_points: list[
        ForecastPoint
    ] = []

    daily_revenues: list[
        float
    ] = []

    current_day = series_start

    while current_day <= today:
        values = row_map.get(
            current_day,
            {
                "revenue": 0.0,
                "sales": 0,
            },
        )

        revenue = float(
            values["revenue"]
        )

        sales = float(
            values["sales"]
        )

        historical_points.append(
            ForecastPoint(
                date=current_day,
                revenue=revenue,
                sales=sales,
            )
        )

        daily_revenues.append(
            revenue
        )

        current_day += timedelta(
            days=1
        )

    historical_revenue = sum(
        point.revenue
        for point
        in historical_points
    )

    historical_sales = int(
        sum(
            point.sales
            for point
            in historical_points
        )
    )

    observed_days = (
        len(
            historical_points
        )
        if rows
        else 0
    )

    active_days = sum(
        1
        for point
        in historical_points
        if point.sales > 0
    )

    average_daily_revenue = (
        historical_revenue
        / observed_days
        if observed_days > 0
        else 0.0
    )

    average_ticket = (
        historical_revenue
        / historical_sales
        if historical_sales > 0
        else 0.0
    )

    (
        slope,
        intercept,
        r_squared,
    ) = _linear_regression(
        daily_revenues
    )

    # Con poco historial una regresión lineal puede
    # producir extrapolaciones extremas.
    #
    # En ese caso usamos el promedio histórico diario
    # como pronóstico base. Cuando existe suficiente
    # información, usamos una tendencia lineal suavizada.
    use_linear_trend = (
        observed_days >= 14
        and active_days >= 5
        and historical_sales >= 12
    )

    trend_weight = min(
        0.65,
        observed_days / 90 * 0.65,
    )

    forecast_points: list[
        ForecastPoint
    ] = []

    predicted_values: list[
        float
    ] = []

    base_index = len(
        daily_revenues
    )

    for offset in range(
        horizon_days
    ):
        forecast_date = (
            today
            + timedelta(
                days=offset + 1,
            )
        )

        baseline = (
            average_daily_revenue
        )

        if (
            historical_sales == 0
            or observed_days == 0
        ):
            predicted = 0.0

        elif use_linear_trend:
            raw_trend = max(
                0.0,
                intercept
                + slope
                * (
                    base_index
                    + offset
                ),
            )

            predicted = (
                baseline
                * (
                    1
                    - trend_weight
                )
                + raw_trend
                * trend_weight
            )

        else:
            predicted = baseline

        predicted = round(
            max(
                0.0,
                predicted,
            ),
            2,
        )

        estimated_sales = (
            predicted
            / average_ticket
            if average_ticket > 0
            else 0.0
        )

        forecast_points.append(
            ForecastPoint(
                date=forecast_date,
                revenue=predicted,
                sales=round(
                    estimated_sales,
                    2,
                ),
            )
        )

        predicted_values.append(
            predicted
        )

    projected_revenue = round(
        sum(
            predicted_values
        ),
        2,
    )

    projected_sales = round(
        sum(
            point.sales
            for point
            in forecast_points
        ),
        1,
    )

    projected_daily_revenue = (
        projected_revenue
        / horizon_days
        if horizon_days > 0
        else 0.0
    )

    if daily_revenues:
        if use_linear_trend:
            residuals = [
                value
                - (
                    intercept
                    + slope * index
                )
                for index, value
                in enumerate(
                    daily_revenues
                )
            ]
        else:
            residuals = [
                value
                - average_daily_revenue
                for value
                in daily_revenues
            ]

        divisor = max(
            1,
            len(residuals) - 1,
        )

        residual_std = sqrt(
            sum(
                residual ** 2
                for residual
                in residuals
            )
            / divisor
        )
    else:
        residual_std = 0.0

    if (
        residual_std == 0
        and historical_sales > 0
    ):
        residual_std = (
            average_daily_revenue
            * 0.20
        )

    total_margin = (
        1.96
        * residual_std
        * sqrt(
            max(
                1,
                horizon_days,
            )
        )
    )

    lower_bound = round(
        max(
            0.0,
            projected_revenue
            - total_margin,
        ),
        2,
    )

    upper_bound = round(
        max(
            projected_revenue,
            projected_revenue
            + total_margin,
        ),
        2,
    )

    if average_daily_revenue > 0:
        trend_percent = (
            (
                projected_daily_revenue
                - average_daily_revenue
            )
            / average_daily_revenue
        ) * 100
    else:
        trend_percent = 0.0

    trend_percent = round(
        trend_percent,
        1,
    )

    if trend_percent > 3:
        trend_direction = (
            "Crecimiento"
        )
    elif trend_percent < -3:
        trend_direction = (
            "Descenso"
        )
    else:
        trend_direction = (
            "Estable"
        )

    (
        confidence_score,
        confidence_label,
    ) = _confidence(
        observed_days=
            observed_days,

        active_days=
            active_days,

        historical_sales=
            historical_sales,

        r_squared=
            r_squared,
    )

    model_name = (
        "Tendencia lineal suavizada de ingresos diarios"
        if use_linear_trend
        else "Promedio histórico diario"
    )

    if historical_sales == 0:
        interpretation = (
            "No existen ventas completadas suficientes "
            "en el historial seleccionado para generar "
            "un pronóstico comercial."
        )

    elif confidence_label == "Baja":
        interpretation = (
            f"Se estiman S/ {projected_revenue:,.2f} "
            f"en los próximos {horizon_days} días. "
            "La confianza es baja porque todavía existen "
            "pocos datos históricos. Por ahora SalesIA usa "
            "el promedio diario observado como referencia "
            "y aplicará una tendencia cuando exista más historial."
        )

    elif trend_direction == "Crecimiento":
        interpretation = (
            f"El comportamiento histórico proyecta "
            f"S/ {projected_revenue:,.2f} en los próximos "
            f"{horizon_days} días y muestra una tendencia "
            "de crecimiento frente al promedio histórico."
        )

    elif trend_direction == "Descenso":
        interpretation = (
            f"El comportamiento histórico proyecta "
            f"S/ {projected_revenue:,.2f} en los próximos "
            f"{horizon_days} días y muestra una tendencia "
            "descendente. Conviene revisar ventas, demanda "
            "y disponibilidad de productos."
        )

    else:
        interpretation = (
            f"El comportamiento histórico proyecta "
            f"S/ {projected_revenue:,.2f} en los próximos "
            f"{horizon_days} días, con una tendencia "
            "relativamente estable."
        )

    return SalesForecastResponse(
        branch_id=branch_id,
        branch_name=branch_name,

        history_start=series_start,
        history_end=today,

        history_days=history_days,
        horizon_days=horizon_days,

        observed_days=
            observed_days,

        active_days=
            active_days,

        historical_revenue=
            round(
                historical_revenue,
                2,
            ),

        historical_sales=
            historical_sales,

        average_daily_revenue=
            round(
                average_daily_revenue,
                2,
            ),

        average_ticket=
            round(
                average_ticket,
                2,
            ),

        projected_revenue=
            projected_revenue,

        projected_sales=
            projected_sales,

        projected_daily_revenue=
            round(
                projected_daily_revenue,
                2,
            ),

        lower_bound=
            lower_bound,

        upper_bound=
            upper_bound,

        trend_percent=
            trend_percent,

        trend_direction=
            trend_direction,

        confidence_score=
            confidence_score,

        confidence_label=
            confidence_label,

        model_name=
            model_name,

        interpretation=
            interpretation,

        historical=
            historical_points,

        forecast=
            forecast_points,
    )
