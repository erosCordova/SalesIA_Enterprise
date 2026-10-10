from datetime import (
    date,
    datetime,
    timedelta,
    timezone,
)
from uuid import UUID

from fastapi import (
    HTTPException,
    status,
)
from sqlalchemy import text

from app.core.database import engine
from app.schemas.business_insights import (
    BusinessInsightItem,
    BusinessInsightMetric,
    BusinessInsightsResponse,
)
from app.services.forecasting import (
    get_sales_forecast,
)


def _money(
    value: float,
) -> str:
    return (
        f"S/ {value:,.2f}"
    )


def _number(
    value: float | int,
) -> str:
    if isinstance(
        value,
        int,
    ):
        return f"{value:,}"

    return f"{value:,.1f}"


def _percent(
    value: float,
) -> str:
    prefix = (
        "+"
        if value > 0
        else ""
    )

    return (
        f"{prefix}{value:,.1f}%"
    )


def _change(
    current: float,
    previous: float,
) -> float | None:

    if previous <= 0:
        return None

    return (
        (
            current
            - previous
        )
        / previous
    ) * 100


def _metric(
    label: str,
    value: str,
) -> BusinessInsightMetric:
    return BusinessInsightMetric(
        label=label,
        value=value,
    )


def get_business_insights(
    *,
    current_user: dict,
    branch_id: UUID | None = None,
) -> BusinessInsightsResponse:

    company_id = (
        current_user[
            "company_id"
        ]
    )

    today = date.today()

    current_start = (
        today
        - timedelta(
            days=6,
        )
    )

    previous_end = (
        current_start
        - timedelta(
            days=1,
        )
    )

    previous_start = (
        previous_end
        - timedelta(
            days=6,
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

                COALESCE(
                    SUM(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :current_start
                            AND :current_end
                    ),
                    0
                ) AS current_revenue,

                COUNT(*) FILTER (
                    WHERE (
                        s.sale_date
                        AT TIME ZONE
                        'America/Lima'
                    )::date
                    BETWEEN
                        :current_start
                        AND :current_end
                ) AS current_sales,

                COALESCE(
                    AVG(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :current_start
                            AND :current_end
                    ),
                    0
                ) AS current_ticket,

                COALESCE(
                    STDDEV_POP(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :current_start
                            AND :current_end
                    ),
                    0
                ) AS current_stddev,

                COALESCE(
                    MAX(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :current_start
                            AND :current_end
                    ),
                    0
                ) AS largest_sale,

                COUNT(
                    DISTINCT (
                        s.sale_date
                        AT TIME ZONE
                        'America/Lima'
                    )::date
                ) FILTER (
                    WHERE (
                        s.sale_date
                        AT TIME ZONE
                        'America/Lima'
                    )::date
                    BETWEEN
                        :current_start
                        AND :current_end
                ) AS active_days,

                COALESCE(
                    SUM(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :previous_start
                            AND :previous_end
                    ),
                    0
                ) AS previous_revenue,

                COUNT(*) FILTER (
                    WHERE (
                        s.sale_date
                        AT TIME ZONE
                        'America/Lima'
                    )::date
                    BETWEEN
                        :previous_start
                        AND :previous_end
                ) AS previous_sales,

                COALESCE(
                    AVG(s.total) FILTER (
                        WHERE (
                            s.sale_date
                            AT TIME ZONE
                            'America/Lima'
                        )::date
                        BETWEEN
                            :previous_start
                            AND :previous_end
                    ),
                    0
                ) AS previous_ticket

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
                BETWEEN
                    :previous_start
                    AND :current_end
        """

        parameters = {
            "company_id":
                company_id,

            "current_start":
                current_start,

            "current_end":
                today,

            "previous_start":
                previous_start,

            "previous_end":
                previous_end,
        }

        if branch_id is not None:
            query += """
                AND s.branch_id =
                    :branch_id
            """

            parameters[
                "branch_id"
            ] = branch_id

        row = connection.execute(
            text(query),
            parameters,
        ).mappings().one()

    current_revenue = float(
        row[
            "current_revenue"
        ]
        or 0
    )

    current_sales = int(
        row[
            "current_sales"
        ]
        or 0
    )

    current_ticket = float(
        row[
            "current_ticket"
        ]
        or 0
    )

    current_stddev = float(
        row[
            "current_stddev"
        ]
        or 0
    )

    largest_sale = float(
        row[
            "largest_sale"
        ]
        or 0
    )

    active_days = int(
        row[
            "active_days"
        ]
        or 0
    )

    previous_revenue = float(
        row[
            "previous_revenue"
        ]
        or 0
    )

    previous_sales = int(
        row[
            "previous_sales"
        ]
        or 0
    )

    previous_ticket = float(
        row[
            "previous_ticket"
        ]
        or 0
    )

    revenue_change = _change(
        current_revenue,
        previous_revenue,
    )

    sales_change = _change(
        float(
            current_sales
        ),
        float(
            previous_sales
        ),
    )

    ticket_change = _change(
        current_ticket,
        previous_ticket,
    )

    coefficient_variation = (
        (
            current_stddev
            / current_ticket
        )
        * 100
        if current_ticket > 0
        else 0
    )

    concentration = (
        (
            largest_sale
            / current_revenue
        )
        * 100
        if current_revenue > 0
        else 0
    )

    insights: list[
        BusinessInsightItem
    ] = []


    def add(
        *,
        insight_id: str,
        category: str,
        severity: str,
        title: str,
        description: str,
        reason: str,
        action_label: str,
        action_path: str,
        metrics: list[
            BusinessInsightMetric
        ],
    ):
        insights.append(
            BusinessInsightItem(
                id=insight_id,
                category=category,
                severity=severity,
                title=title,
                description=description,
                reason=reason,
                action_label=
                    action_label,
                action_path=
                    action_path,
                metrics=metrics,
            )
        )


    # ========================================================
    # SIN VENTAS RECIENTES
    # ========================================================

    if current_sales == 0:

        if previous_sales > 0:
            add(
                insight_id=
                    "no-current-sales",

                category=
                    "attention",

                severity=
                    "high",

                title=
                    "No hubo ventas en los últimos 7 días",

                description=(
                    "El periodo actual no registra "
                    "ventas completadas."
                ),

                reason=(
                    "En los siete días anteriores "
                    f"se registraron {previous_sales} "
                    "ventas, por lo que la ausencia "
                    "de actividad merece revisión."
                ),

                action_label=
                    "Revisar ventas",

                action_path=
                    "/sales",

                metrics=[
                    _metric(
                        "Ventas actuales",
                        "0",
                    ),

                    _metric(
                        "Ventas anteriores",
                        _number(
                            previous_sales
                        ),
                    ),
                ],
            )

        else:
            add(
                insight_id=
                    "no-commercial-history",

                category=
                    "info",

                severity=
                    "low",

                title=
                    "Todavía no hay actividad suficiente",

                description=(
                    "No existen ventas completadas "
                    "en los últimos catorce días."
                ),

                reason=(
                    "SalesIA necesita operaciones "
                    "registradas para detectar "
                    "tendencias comerciales."
                ),

                action_label=
                    "Ir a ventas",

                action_path=
                    "/sales",

                metrics=[],
            )


    # ========================================================
    # CAMBIO DE INGRESOS
    # ========================================================

    if (
        revenue_change
        is not None
    ):

        if revenue_change >= 20:
            add(
                insight_id=
                    "revenue-growth",

                category=
                    "opportunity",

                severity=
                    "low",

                title=
                    "Los ingresos crecieron con fuerza",

                description=(
                    "La facturación de los últimos "
                    "7 días superó claramente al "
                    "periodo anterior."
                ),

                reason=(
                    "El crecimiento puede señalar "
                    "mayor demanda o mejores "
                    "resultados comerciales."
                ),

                action_label=
                    "Ver análisis",

                action_path=
                    "/analytics",

                metrics=[
                    _metric(
                        "Ingresos actuales",
                        _money(
                            current_revenue
                        ),
                    ),

                    _metric(
                        "Periodo anterior",
                        _money(
                            previous_revenue
                        ),
                    ),

                    _metric(
                        "Variación",
                        _percent(
                            revenue_change
                        ),
                    ),
                ],
            )

        elif revenue_change <= -20:
            add(
                insight_id=
                    "revenue-drop",

                category=
                    "attention",

                severity=
                    "high",

                title=
                    "Los ingresos disminuyeron",

                description=(
                    "La facturación de los últimos "
                    "7 días cayó frente al periodo "
                    "inmediatamente anterior."
                ),

                reason=(
                    "Una caída relevante puede "
                    "estar relacionada con menor "
                    "actividad, menor ticket o una "
                    "combinación de ambos."
                ),

                action_label=
                    "Analizar la caída",

                action_path=
                    "/analytics",

                metrics=[
                    _metric(
                        "Ingresos actuales",
                        _money(
                            current_revenue
                        ),
                    ),

                    _metric(
                        "Periodo anterior",
                        _money(
                            previous_revenue
                        ),
                    ),

                    _metric(
                        "Variación",
                        _percent(
                            revenue_change
                        ),
                    ),
                ],
            )


    # ========================================================
    # CAMBIO DE CANTIDAD DE VENTAS
    # ========================================================

    if (
        sales_change
        is not None
        and (
            revenue_change
            is None
            or abs(
                sales_change
                - revenue_change
            ) >= 15
        )
    ):
        if sales_change >= 30:
            add(
                insight_id=
                    "sales-growth",

                category=
                    "opportunity",

                severity=
                    "low",

                title=
                    "Aumentó la cantidad de ventas",

                description=(
                    "Se registraron más operaciones "
                    "que durante los siete días "
                    "anteriores."
                ),

                reason=(
                    "El volumen de transacciones "
                    "creció de forma relevante."
                ),

                action_label=
                    "Ver ventas",

                action_path=
                    "/sales",

                metrics=[
                    _metric(
                        "Ventas actuales",
                        _number(
                            current_sales
                        ),
                    ),

                    _metric(
                        "Ventas anteriores",
                        _number(
                            previous_sales
                        ),
                    ),

                    _metric(
                        "Variación",
                        _percent(
                            sales_change
                        ),
                    ),
                ],
            )

        elif sales_change <= -30:
            add(
                insight_id=
                    "sales-drop",

                category=
                    "attention",

                severity=
                    "medium",

                title=
                    "Disminuyó la cantidad de ventas",

                description=(
                    "El número de operaciones "
                    "completadas cayó respecto de "
                    "la semana anterior."
                ),

                reason=(
                    "Una reducción del volumen "
                    "puede afectar los ingresos "
                    "aunque el ticket promedio se "
                    "mantenga."
                ),

                action_label=
                    "Revisar ventas",

                action_path=
                    "/sales",

                metrics=[
                    _metric(
                        "Ventas actuales",
                        _number(
                            current_sales
                        ),
                    ),

                    _metric(
                        "Ventas anteriores",
                        _number(
                            previous_sales
                        ),
                    ),

                    _metric(
                        "Variación",
                        _percent(
                            sales_change
                        ),
                    ),
                ],
            )


    # ========================================================
    # TICKET PROMEDIO
    # ========================================================

    if (
        ticket_change
        is not None
        and current_sales > 0
        and previous_sales > 0
        and abs(
            ticket_change
        ) >= 20
    ):
        if ticket_change > 0:
            category = (
                "opportunity"
            )

            severity = (
                "low"
            )

            title = (
                "El ticket promedio aumentó"
            )

            reason = (
                "Cada operación está generando, "
                "en promedio, más ingresos que "
                "durante el periodo anterior."
            )

        else:
            category = (
                "attention"
            )

            severity = (
                "medium"
            )

            title = (
                "El ticket promedio disminuyó"
            )

            reason = (
                "Cada operación está generando, "
                "en promedio, menos ingresos que "
                "durante el periodo anterior."
            )

        add(
            insight_id=
                "ticket-change",

            category=
                category,

            severity=
                severity,

            title=
                title,

            description=(
                "El importe medio por venta cambió "
                "de manera relevante."
            ),

            reason=
                reason,

            action_label=
                "Ver estadísticas",

            action_path=
                "/statistics",

            metrics=[
                _metric(
                    "Ticket actual",
                    _money(
                        current_ticket
                    ),
                ),

                _metric(
                    "Ticket anterior",
                    _money(
                        previous_ticket
                    ),
                ),

                _metric(
                    "Variación",
                    _percent(
                        ticket_change
                    ),
                ),
            ],
        )


    # ========================================================
    # POCOS DIAS CON ACTIVIDAD
    # ========================================================

    if (
        current_sales >= 2
        and active_days <= 2
    ):
        add(
            insight_id=
                "low-active-days",

            category=
                "attention",

            severity=
                "medium",

            title=
                "Las ventas están concentradas en pocos días",

            description=(
                f"Solo hubo actividad comercial "
                f"en {active_days} de los últimos "
                "7 días."
            ),

            reason=(
                "Una actividad muy concentrada "
                "puede hacer que los resultados "
                "dependan demasiado de días "
                "puntuales."
            ),

            action_label=
                "Ver evolución",

            action_path=
                "/analytics",

            metrics=[
                _metric(
                    "Días con ventas",
                    f"{active_days} de 7",
                ),

                _metric(
                    "Ventas",
                    _number(
                        current_sales
                    ),
                ),
            ],
        )


    # ========================================================
    # VARIABILIDAD DE TICKETS
    # ========================================================

    if (
        current_sales >= 4
        and coefficient_variation
        >= 80
    ):
        add(
            insight_id=
                "high-ticket-variability",

            category=
                "attention",

            severity=
                "medium",

            title=
                "Los importes de las ventas son muy variables",

            description=(
                "Existen diferencias importantes "
                "entre ventas pequeñas y grandes."
            ),

            reason=(
                "El coeficiente de variación del "
                "ticket es elevado, por lo que el "
                "promedio por sí solo no representa "
                "bien a todas las operaciones."
            ),

            action_label=
                "Ver estadísticas",

            action_path=
                "/statistics",

            metrics=[
                _metric(
                    "Ticket promedio",
                    _money(
                        current_ticket
                    ),
                ),

                _metric(
                    "Variabilidad",
                    _percent(
                        coefficient_variation
                    ),
                ),
            ],
        )


    # ========================================================
    # CONCENTRACION EN UNA SOLA VENTA
    # ========================================================

    if (
        current_sales >= 3
        and concentration >= 65
    ):
        add(
            insight_id=
                "sale-concentration",

            category=
                "attention",

            severity=
                "medium",

            title=
                "Una sola venta concentra gran parte de los ingresos",

            description=(
                "El resultado semanal depende "
                "considerablemente de una operación."
            ),

            reason=(
                "Cuando una sola venta representa "
                "gran parte del ingreso total, el "
                "promedio puede dar una impresión "
                "distorsionada del comportamiento "
                "habitual."
            ),

            action_label=
                "Examinar distribución",

            action_path=
                "/statistics",

            metrics=[
                _metric(
                    "Mayor venta",
                    _money(
                        largest_sale
                    ),
                ),

                _metric(
                    "Participación",
                    _percent(
                        concentration
                    ),
                ),
            ],
        )


    # ========================================================
    # PRONOSTICO
    # ========================================================

    forecast = get_sales_forecast(
        current_user=
            current_user,

        horizon_days=30,

        history_days=90,

        branch_id=
            branch_id,
    )

    if (
        forecast.historical_sales
        > 0
    ):
        if (
            forecast.confidence_score
            < 50
        ):
            add(
                insight_id=
                    "low-forecast-confidence",

                category=
                    "info",

                severity=
                    "low",

                title=
                    "El pronóstico todavía tiene poca información",

                description=(
                    "SalesIA puede estimar ventas "
                    "futuras, pero la cantidad de "
                    "historial aún es limitada."
                ),

                reason=(
                    "La confianza del pronóstico "
                    "mejorará automáticamente a "
                    "medida que se registren más "
                    "ventas y más días de actividad."
                ),

                action_label=
                    "Ver pronóstico",

                action_path=
                    "/forecasts",

                metrics=[
                    _metric(
                        "Confianza",
                        (
                            f"{forecast.confidence_label} "
                            f"({forecast.confidence_score:.1f}%)"
                        ),
                    ),

                    _metric(
                        "Ventas históricas",
                        _number(
                            forecast
                            .historical_sales
                        ),
                    ),
                ],
            )

        elif (
            forecast.trend_percent
            >= 10
        ):
            add(
                insight_id=
                    "forecast-growth",

                category=
                    "opportunity",

                severity=
                    "low",

                title=
                    "El pronóstico apunta a crecimiento",

                description=(
                    "La proyección comercial "
                    "anticipa mejores resultados "
                    "para los próximos 30 días."
                ),

                reason=(
                    "El modelo detecta una tendencia "
                    "positiva con una cantidad de "
                    "datos suficiente para elevar "
                    "su nivel de confianza."
                ),

                action_label=
                    "Ver pronóstico",

                action_path=
                    "/forecasts",

                metrics=[
                    _metric(
                        "Proyección",
                        _money(
                            forecast
                            .projected_revenue
                        ),
                    ),

                    _metric(
                        "Tendencia",
                        _percent(
                            forecast
                            .trend_percent
                        ),
                    ),
                ],
            )

        elif (
            forecast.trend_percent
            <= -10
        ):
            add(
                insight_id=
                    "forecast-drop",

                category=
                    "attention",

                severity=
                    "medium",

                title=
                    "El pronóstico anticipa una posible caída",

                description=(
                    "La tendencia proyectada para "
                    "los próximos 30 días es inferior "
                    "al promedio histórico."
                ),

                reason=(
                    "Conviene revisar ventas y "
                    "comportamiento comercial antes "
                    "de asumir que la caída será "
                    "permanente."
                ),

                action_label=
                    "Revisar pronóstico",

                action_path=
                    "/forecasts",

                metrics=[
                    _metric(
                        "Proyección",
                        _money(
                            forecast
                            .projected_revenue
                        ),
                    ),

                    _metric(
                        "Tendencia",
                        _percent(
                            forecast
                            .trend_percent
                        ),
                    ),
                ],
            )


    # ========================================================
    # CUANDO NO HAY ALERTAS IMPORTANTES
    # ========================================================

    if (
        current_sales > 0
        and len(
            insights
        ) == 0
    ):
        add(
            insight_id=
                "stable-period",

            category=
                "trend",

            severity=
                "low",

            title=
                "No se detectaron cambios importantes",

            description=(
                "El comportamiento comercial "
                "reciente se mantiene dentro de "
                "rangos similares al periodo anterior."
            ),

            reason=(
                "No existen variaciones suficientemente "
                "grandes como para generar una alerta "
                "o una oportunidad destacada."
            ),

            action_label=
                "Ver análisis",

            action_path=
                "/analytics",

            metrics=[
                _metric(
                    "Ingresos",
                    _money(
                        current_revenue
                    ),
                ),

                _metric(
                    "Ventas",
                    _number(
                        current_sales
                    ),
                ),
            ],
        )


    severity_order = {
        "high": 0,
        "medium": 1,
        "low": 2,
    }

    category_order = {
        "attention": 0,
        "opportunity": 1,
        "trend": 2,
        "info": 3,
    }

    insights.sort(
        key=lambda item: (
            category_order.get(
                item.category,
                9,
            ),
            severity_order.get(
                item.severity,
                9,
            ),
            item.title,
        )
    )


    return BusinessInsightsResponse(
        branch_id=
            branch_id,

        branch_name=
            branch_name,

        period_start=
            current_start,

        period_end=
            today,

        comparison_start=
            previous_start,

        comparison_end=
            previous_end,

        generated_at=
            datetime.now(
                timezone.utc
            ),

        current_sales=
            current_sales,

        current_revenue=
            round(
                current_revenue,
                2,
            ),

        current_average_ticket=
            round(
                current_ticket,
                2,
            ),

        active_days=
            active_days,

        insights=
            insights,
    )
