from datetime import date
from math import sqrt
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.database import engine
from app.schemas.business_statistics import (
    SalesBusinessStatisticsResponse,
    SalesDistributionBin,
)


def _percentile(
    sorted_values: list[float],
    percentile: float,
) -> float:
    if not sorted_values:
        return 0.0

    if len(sorted_values) == 1:
        return sorted_values[0]

    position = (
        len(sorted_values) - 1
    ) * percentile

    lower_index = int(position)
    upper_index = min(
        lower_index + 1,
        len(sorted_values) - 1,
    )

    fraction = (
        position - lower_index
    )

    return (
        sorted_values[lower_index]
        + (
            sorted_values[upper_index]
            - sorted_values[lower_index]
        )
        * fraction
    )


def _distribution(
    values: list[float],
) -> list[SalesDistributionBin]:
    if not values:
        return []

    minimum = min(values)
    maximum = max(values)

    if minimum == maximum:
        return [
            SalesDistributionBin(
                label=f"S/ {minimum:,.0f}",
                lower_bound=minimum,
                upper_bound=maximum,
                count=len(values),
            )
        ]

    count = len(values)

    if count < 8:
        bin_count = 3
    elif count < 25:
        bin_count = 5
    else:
        bin_count = 7

    width = (
        maximum - minimum
    ) / bin_count

    counters = [
        0 for _ in range(
            bin_count
        )
    ]

    for value in values:
        index = int(
            (
                value - minimum
            ) / width
        )

        index = min(
            bin_count - 1,
            max(
                0,
                index,
            ),
        )

        counters[index] += 1

    result: list[
        SalesDistributionBin
    ] = []

    for index in range(
        bin_count
    ):
        lower = (
            minimum
            + width * index
        )

        upper = (
            maximum
            if index
            == bin_count - 1
            else minimum
            + width
            * (index + 1)
        )

        result.append(
            SalesDistributionBin(
                label=(
                    f"S/ {lower:,.0f}"
                    f" – "
                    f"S/ {upper:,.0f}"
                ),
                lower_bound=round(
                    lower,
                    2,
                ),
                upper_bound=round(
                    upper,
                    2,
                ),
                count=counters[
                    index
                ],
            )
        )

    return result


def get_sales_business_statistics(
    *,
    current_user: dict,
    start_date: date,
    end_date: date,
    branch_id: UUID | None = None,
) -> SalesBusinessStatisticsResponse:

    if start_date > end_date:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha inicial no puede "
                "ser posterior a la fecha final."
            ),
        )

    company_id = (
        current_user[
            "company_id"
        ]
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
                        name
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
                    detail=(
                        "La sucursal seleccionada "
                        "no existe."
                    ),
                )

            branch_name = (
                branch["name"]
            )

        query = """
            SELECT
                s.total
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
                )::date >= :start_date

                AND (
                    s.sale_date
                    AT TIME ZONE
                    'America/Lima'
                )::date <= :end_date
        """

        parameters = {
            "company_id":
                company_id,
            "start_date":
                start_date,
            "end_date":
                end_date,
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
            ORDER BY s.total
        """

        rows = connection.execute(
            text(query),
            parameters,
        ).mappings().all()

    values = [
        float(
            row["total"]
            or 0
        )
        for row in rows
    ]

    count = len(values)

    if count == 0:
        return SalesBusinessStatisticsResponse(
            branch_id=branch_id,
            branch_name=branch_name,

            start_date=start_date,
            end_date=end_date,

            count=0,
            total_revenue=0,

            mean=0,
            median=0,

            variance=0,
            standard_deviation=0,

            minimum=0,
            maximum=0,
            range_value=0,

            q1=0,
            q3=0,
            iqr=0,

            coefficient_variation=0,

            variability_label=
                "Sin datos",

            interpretation=(
                "No existen ventas completadas "
                "en el periodo seleccionado."
            ),

            distribution=[],
        )

    sorted_values = sorted(
        values
    )

    total_revenue = sum(
        values
    )

    mean = (
        total_revenue / count
    )

    if count % 2 == 1:
        median = sorted_values[
            count // 2
        ]
    else:
        middle = count // 2

        median = (
            sorted_values[
                middle - 1
            ]
            + sorted_values[
                middle
            ]
        ) / 2

    variance = sum(
        (
            value - mean
        ) ** 2
        for value in values
    ) / count

    standard_deviation = sqrt(
        variance
    )

    minimum = min(
        values
    )

    maximum = max(
        values
    )

    range_value = (
        maximum - minimum
    )

    q1 = _percentile(
        sorted_values,
        0.25,
    )

    q3 = _percentile(
        sorted_values,
        0.75,
    )

    iqr = (
        q3 - q1
    )

    coefficient_variation = (
        (
            standard_deviation
            / mean
        ) * 100
        if mean != 0
        else 0
    )

    if coefficient_variation < 15:
        variability_label = (
            "Baja"
        )
    elif coefficient_variation < 35:
        variability_label = (
            "Media"
        )
    else:
        variability_label = (
            "Alta"
        )

    if count < 5:
        interpretation = (
            "La muestra todavía es pequeña. "
            "Las estadísticas son válidas para "
            "las ventas registradas, pero conviene "
            "acumular más operaciones antes de "
            "extraer conclusiones generales."
        )

    elif variability_label == "Baja":
        interpretation = (
            "Los importes de las ventas son "
            "relativamente consistentes entre sí. "
            "El ticket presenta poca variación "
            "respecto de su promedio."
        )

    elif variability_label == "Media":
        interpretation = (
            "Los importes presentan una variación "
            "moderada. Existen diferencias entre "
            "tickets, pero sin una dispersión extrema."
        )

    else:
        interpretation = (
            "Los importes de las ventas presentan "
            "alta variabilidad. Algunas operaciones "
            "son considerablemente mayores o menores "
            "que el ticket promedio."
        )

    if (
        count >= 5
        and mean > median * 1.20
    ):
        interpretation += (
            " Además, algunas ventas altas están "
            "elevando el promedio por encima "
            "de la mediana."
        )

    return SalesBusinessStatisticsResponse(
        branch_id=branch_id,
        branch_name=branch_name,

        start_date=start_date,
        end_date=end_date,

        count=count,

        total_revenue=round(
            total_revenue,
            2,
        ),

        mean=round(
            mean,
            2,
        ),

        median=round(
            median,
            2,
        ),

        variance=round(
            variance,
            4,
        ),

        standard_deviation=round(
            standard_deviation,
            2,
        ),

        minimum=round(
            minimum,
            2,
        ),

        maximum=round(
            maximum,
            2,
        ),

        range_value=round(
            range_value,
            2,
        ),

        q1=round(
            q1,
            2,
        ),

        q3=round(
            q3,
            2,
        ),

        iqr=round(
            iqr,
            2,
        ),

        coefficient_variation=round(
            coefficient_variation,
            1,
        ),

        variability_label=
            variability_label,

        interpretation=
            interpretation,

        distribution=
            _distribution(
                values
            ),
    )
