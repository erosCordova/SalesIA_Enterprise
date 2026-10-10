from datetime import (
    date,
    datetime,
    timezone,
)
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import (
    HTTPException,
    status,
)
from sqlalchemy import text

from app.core.database import engine
from app.schemas.business_reports import (
    BusinessReportColumn,
    BusinessReportResponse,
    BusinessReportSummaryItem,
    BusinessReportType,
)


BRANCH_REPORT_TYPES = {
    "sales",
    "products",
    "customers",
}


def _summary(
    key: str,
    label: str,
    value: int | float | str,
    format: str = "text",
):
    return BusinessReportSummaryItem(
        key=key,
        label=label,
        value=value,
        format=format,
    )


def _column(
    key: str,
    label: str,
    format: str = "text",
):
    return BusinessReportColumn(
        key=key,
        label=label,
        format=format,
    )


def _serialize_value(
    value: Any,
):
    if isinstance(
        value,
        Decimal,
    ):
        return float(value)

    if isinstance(
        value,
        (
            date,
            datetime,
        ),
    ):
        return value.isoformat()

    if isinstance(
        value,
        UUID,
    ):
        return str(value)

    return value


def _serialize_rows(
    rows,
):
    return [
        {
            key:
                _serialize_value(
                    value
                )
            for key, value
            in dict(row).items()
        }
        for row in rows
    ]


def _verify_branch(
    connection,
    *,
    company_id: UUID,
    branch_id: UUID,
):
    return connection.execute(
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
            "company_id":
                company_id,

            "branch_id":
                branch_id,
        },
    ).mappings().first()


def _sales_filters(
    branch_id: UUID | None,
):
    result = """
        s.company_id = :company_id

        AND s.status = 'completed'

        AND (
            s.sale_date
            AT TIME ZONE
            'America/Lima'
        )::date
        BETWEEN
            :start_date
            AND :end_date
    """

    if branch_id is not None:
        result += """
            AND s.branch_id = :branch_id
        """

    return result


def _base_parameters(
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
    branch_id: UUID | None,
):
    parameters = {
        "company_id":
            company_id,

        "start_date":
            start_date,

        "end_date":
            end_date,
    }

    if branch_id is not None:
        parameters[
            "branch_id"
        ] = branch_id

    return parameters


def _sales_report(
    connection,
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
    branch_id: UUID | None,
):
    filters = _sales_filters(
        branch_id
    )

    parameters = (
        _base_parameters(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
        )
    )

    aggregate = connection.execute(
        text(f"""
            SELECT
                COUNT(*)::int
                    AS total_sales,

                COALESCE(
                    SUM(s.total),
                    0
                )::float8
                    AS total_revenue,

                COALESCE(
                    AVG(s.total),
                    0
                )::float8
                    AS average_ticket

            FROM sales s

            WHERE {filters}
        """),
        parameters,
    ).mappings().one()

    rows = connection.execute(
        text(f"""
            SELECT
                s.sale_number,

                TO_CHAR(
                    s.sale_date
                    AT TIME ZONE
                    'America/Lima',
                    'YYYY-MM-DD'
                ) AS sale_date,

                COALESCE(
                    b.name,
                    'Sin sucursal'
                ) AS branch,

                COALESCE(
                    NULLIF(
                        c.business_name,
                        ''
                    ),
                    NULLIF(
                        CONCAT_WS(
                            ' ',
                            c.first_name,
                            c.last_name
                        ),
                        ''
                    ),
                    'Cliente general'
                ) AS customer,

                s.total::float8
                    AS total,

                CASE
                    WHEN s.status =
                        'completed'
                        THEN 'Completada'

                    WHEN s.status =
                        'cancelled'
                        THEN 'Anulada'

                    ELSE s.status
                END AS status

            FROM sales s

            LEFT JOIN branches b
                ON b.id = s.branch_id
               AND b.company_id =
                    s.company_id

            LEFT JOIN customers c
                ON c.id =
                    s.customer_id

            WHERE {filters}

            ORDER BY
                s.sale_date DESC

            LIMIT 500
        """),
        parameters,
    ).mappings().all()

    return {
        "title":
            "Reporte de ventas",

        "description":
            "Detalle de las ventas completadas dentro del periodo seleccionado.",

        "summary": [
            _summary(
                "total_sales",
                "Ventas",
                int(
                    aggregate[
                        "total_sales"
                    ]
                    or 0
                ),
                "number",
            ),

            _summary(
                "total_revenue",
                "Ingresos",
                float(
                    aggregate[
                        "total_revenue"
                    ]
                    or 0
                ),
                "currency",
            ),

            _summary(
                "average_ticket",
                "Ticket promedio",
                float(
                    aggregate[
                        "average_ticket"
                    ]
                    or 0
                ),
                "currency",
            ),
        ],

        "columns": [
            _column(
                "sale_number",
                "Venta",
            ),

            _column(
                "sale_date",
                "Fecha",
                "date",
            ),

            _column(
                "branch",
                "Sucursal",
            ),

            _column(
                "customer",
                "Cliente",
            ),

            _column(
                "total",
                "Total",
                "currency",
            ),

            _column(
                "status",
                "Estado",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def _branches_report(
    connection,
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
):
    parameters = {
        "company_id":
            company_id,

        "start_date":
            start_date,

        "end_date":
            end_date,
    }

    rows = connection.execute(
        text("""
            SELECT
                COALESCE(
                    b.name,
                    'Sin sucursal'
                ) AS branch,

                COALESCE(
                    b.code,
                    '—'
                ) AS code,

                COUNT(s.id)::int
                    AS sales,

                COALESCE(
                    SUM(s.total),
                    0
                )::float8
                    AS revenue,

                COALESCE(
                    AVG(s.total),
                    0
                )::float8
                    AS average_ticket

            FROM sales s

            LEFT JOIN branches b
                ON b.id = s.branch_id
               AND b.company_id =
                    s.company_id

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
                    :start_date
                    AND :end_date

            GROUP BY
                b.id,
                b.name,
                b.code

            ORDER BY
                revenue DESC
        """),
        parameters,
    ).mappings().all()

    total_sales = sum(
        int(
            row["sales"]
            or 0
        )
        for row in rows
    )

    total_revenue = sum(
        float(
            row["revenue"]
            or 0
        )
        for row in rows
    )

    best_branch = (
        rows[0]["branch"]
        if rows
        else "Sin datos"
    )

    return {
        "title":
            "Ventas por sucursal",

        "description":
            "Compara el rendimiento comercial de las sucursales.",

        "summary": [
            _summary(
                "branches",
                "Sucursales con ventas",
                len(rows),
                "number",
            ),

            _summary(
                "sales",
                "Ventas",
                total_sales,
                "number",
            ),

            _summary(
                "revenue",
                "Ingresos",
                total_revenue,
                "currency",
            ),

            _summary(
                "best_branch",
                "Mejor resultado",
                best_branch,
                "text",
            ),
        ],

        "columns": [
            _column(
                "branch",
                "Sucursal",
            ),

            _column(
                "code",
                "Código",
            ),

            _column(
                "sales",
                "Ventas",
                "number",
            ),

            _column(
                "revenue",
                "Ingresos",
                "currency",
            ),

            _column(
                "average_ticket",
                "Ticket promedio",
                "currency",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def _products_report(
    connection,
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
    branch_id: UUID | None,
):
    filters = _sales_filters(
        branch_id
    )

    parameters = (
        _base_parameters(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
        )
    )

    rows = connection.execute(
        text(f"""
            SELECT
                p.sku,

                p.name
                    AS product,

                COUNT(
                    DISTINCT s.id
                )::int
                    AS sales,

                COALESCE(
                    SUM(sd.quantity),
                    0
                )::float8
                    AS units,

                COALESCE(
                    SUM(sd.subtotal),
                    0
                )::float8
                    AS revenue

            FROM sale_details sd

            JOIN sales s
                ON s.id =
                    sd.sale_id

            JOIN products p
                ON p.id =
                    sd.product_id

            WHERE {filters}

            GROUP BY
                p.id,
                p.sku,
                p.name

            ORDER BY
                units DESC,
                revenue DESC

            LIMIT 200
        """),
        parameters,
    ).mappings().all()

    total_units = sum(
        float(
            row["units"]
            or 0
        )
        for row in rows
    )

    total_revenue = sum(
        float(
            row["revenue"]
            or 0
        )
        for row in rows
    )

    top_product = (
        rows[0]["product"]
        if rows
        else "Sin datos"
    )

    return {
        "title":
            "Productos más vendidos",

        "description":
            "Ranking de productos según las unidades vendidas en el periodo.",

        "summary": [
            _summary(
                "products",
                "Productos vendidos",
                len(rows),
                "number",
            ),

            _summary(
                "units",
                "Unidades vendidas",
                total_units,
                "number",
            ),

            _summary(
                "revenue",
                "Ingresos",
                total_revenue,
                "currency",
            ),

            _summary(
                "top_product",
                "Más vendido",
                top_product,
                "text",
            ),
        ],

        "columns": [
            _column(
                "sku",
                "SKU",
            ),

            _column(
                "product",
                "Producto",
            ),

            _column(
                "sales",
                "Ventas",
                "number",
            ),

            _column(
                "units",
                "Unidades",
                "number",
            ),

            _column(
                "revenue",
                "Ingresos",
                "currency",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def _customers_report(
    connection,
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
    branch_id: UUID | None,
):
    filters = _sales_filters(
        branch_id
    )

    parameters = (
        _base_parameters(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
        )
    )

    rows = connection.execute(
        text(f"""
            SELECT
                COALESCE(
                    NULLIF(
                        c.business_name,
                        ''
                    ),
                    NULLIF(
                        CONCAT_WS(
                            ' ',
                            c.first_name,
                            c.last_name
                        ),
                        ''
                    ),
                    'Cliente general'
                ) AS customer,

                COALESCE(
                    c.document_number,
                    '—'
                ) AS document,

                COUNT(s.id)::int
                    AS purchases,

                COALESCE(
                    SUM(s.total),
                    0
                )::float8
                    AS total_spent,

                COALESCE(
                    AVG(s.total),
                    0
                )::float8
                    AS average_purchase,

                TO_CHAR(
                    MAX(
                        s.sale_date
                        AT TIME ZONE
                        'America/Lima'
                    ),
                    'YYYY-MM-DD'
                ) AS last_purchase

            FROM sales s

            LEFT JOIN customers c
                ON c.id =
                    s.customer_id

            WHERE {filters}

            GROUP BY
                c.id,
                c.business_name,
                c.first_name,
                c.last_name,
                c.document_number

            ORDER BY
                total_spent DESC

            LIMIT 200
        """),
        parameters,
    ).mappings().all()

    total_spent = sum(
        float(
            row["total_spent"]
            or 0
        )
        for row in rows
    )

    top_customer = (
        rows[0]["customer"]
        if rows
        else "Sin datos"
    )

    return {
        "title":
            "Reporte de clientes",

        "description":
            "Clientes con compras registradas y su comportamiento durante el periodo.",

        "summary": [
            _summary(
                "customers",
                "Clientes compradores",
                len(rows),
                "number",
            ),

            _summary(
                "revenue",
                "Ingresos asociados",
                total_spent,
                "currency",
            ),

            _summary(
                "top_customer",
                "Principal cliente",
                top_customer,
                "text",
            ),
        ],

        "columns": [
            _column(
                "customer",
                "Cliente",
            ),

            _column(
                "document",
                "Documento",
            ),

            _column(
                "purchases",
                "Compras",
                "number",
            ),

            _column(
                "total_spent",
                "Total comprado",
                "currency",
            ),

            _column(
                "average_purchase",
                "Compra promedio",
                "currency",
            ),

            _column(
                "last_purchase",
                "Última compra",
                "date",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def _inventory_report(
    connection,
    *,
    company_id: UUID,
):
    rows = connection.execute(
        text("""
            SELECT
                p.sku,

                p.name
                    AS product,

                COALESCE(
                    i.stock_quantity,
                    0
                )::float8
                    AS stock,

                COALESCE(
                    i.minimum_stock,
                    0
                )::float8
                    AS minimum_stock,

                CASE
                    WHEN i.maximum_stock
                        IS NULL
                        THEN NULL

                    ELSE
                        i.maximum_stock::float8
                END AS maximum_stock,

                CASE
                    WHEN COALESCE(
                        i.stock_quantity,
                        0
                    ) <= 0
                        THEN 'Sin stock'

                    WHEN COALESCE(
                        i.stock_quantity,
                        0
                    ) <= COALESCE(
                        i.minimum_stock,
                        0
                    )
                        THEN 'Stock bajo'

                    ELSE 'Disponible'
                END AS status

            FROM products p

            LEFT JOIN inventory i
                ON i.product_id =
                    p.id
               AND i.company_id =
                    p.company_id

            WHERE
                p.company_id =
                    :company_id

            ORDER BY
                p.name
        """),
        {
            "company_id":
                company_id,
        },
    ).mappings().all()

    total_stock = sum(
        float(
            row["stock"]
            or 0
        )
        for row in rows
    )

    low_stock = sum(
        1
        for row in rows
        if row["status"]
        == "Stock bajo"
    )

    no_stock = sum(
        1
        for row in rows
        if row["status"]
        == "Sin stock"
    )

    return {
        "title":
            "Reporte de inventario",

        "description":
            "Estado actual del stock registrado para la empresa.",

        "summary": [
            _summary(
                "products",
                "Productos",
                len(rows),
                "number",
            ),

            _summary(
                "stock",
                "Unidades en stock",
                total_stock,
                "number",
            ),

            _summary(
                "low_stock",
                "Stock bajo",
                low_stock,
                "number",
            ),

            _summary(
                "no_stock",
                "Sin stock",
                no_stock,
                "number",
            ),
        ],

        "columns": [
            _column(
                "sku",
                "SKU",
            ),

            _column(
                "product",
                "Producto",
            ),

            _column(
                "stock",
                "Stock",
                "number",
            ),

            _column(
                "minimum_stock",
                "Mínimo",
                "number",
            ),

            _column(
                "maximum_stock",
                "Máximo",
                "number",
            ),

            _column(
                "status",
                "Estado",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def _kardex_report(
    connection,
    *,
    company_id: UUID,
    start_date: date,
    end_date: date,
):
    parameters = {
        "company_id":
            company_id,

        "start_date":
            start_date,

        "end_date":
            end_date,
    }

    rows = connection.execute(
        text("""
            SELECT
                TO_CHAR(
                    im.movement_date
                    AT TIME ZONE
                    'America/Lima',
                    'YYYY-MM-DD HH24:MI'
                ) AS movement_date,

                p.sku,

                p.name
                    AS product,

                CASE
                    WHEN LOWER(
                        im.movement_type
                    ) IN (
                        'entry',
                        'in',
                        'entrada'
                    )
                        THEN 'Entrada'

                    WHEN LOWER(
                        im.movement_type
                    ) IN (
                        'exit',
                        'out',
                        'salida'
                    )
                        THEN 'Salida'

                    ELSE
                        im.movement_type
                END AS movement_type,

                im.quantity::float8
                    AS quantity,

                COALESCE(
                    im.reference_type,
                    '—'
                ) AS reference,

                COALESCE(
                    im.reason,
                    'Sin motivo especificado'
                ) AS reason,

                COALESCE(
                    NULLIF(
                        CONCAT_WS(
                            ' ',
                            u.first_name,
                            u.last_name
                        ),
                        ''
                    ),
                    'Sistema'
                ) AS user_name

            FROM inventory_movements im

            JOIN products p
                ON p.id =
                    im.product_id

            LEFT JOIN users u
                ON u.id =
                    im.user_id

            WHERE
                im.company_id =
                    :company_id

                AND (
                    im.movement_date
                    AT TIME ZONE
                    'America/Lima'
                )::date
                BETWEEN
                    :start_date
                    AND :end_date

            ORDER BY
                im.movement_date DESC

            LIMIT 500
        """),
        parameters,
    ).mappings().all()

    entries = sum(
        float(
            row["quantity"]
            or 0
        )
        for row in rows
        if row["movement_type"]
        == "Entrada"
    )

    exits = sum(
        float(
            row["quantity"]
            or 0
        )
        for row in rows
        if row["movement_type"]
        == "Salida"
    )

    return {
        "title":
            "Reporte de Kardex",

        "description":
            "Movimientos de entrada y salida registrados durante el periodo.",

        "summary": [
            _summary(
                "movements",
                "Movimientos",
                len(rows),
                "number",
            ),

            _summary(
                "entries",
                "Unidades de entrada",
                entries,
                "number",
            ),

            _summary(
                "exits",
                "Unidades de salida",
                exits,
                "number",
            ),
        ],

        "columns": [
            _column(
                "movement_date",
                "Fecha",
            ),

            _column(
                "sku",
                "SKU",
            ),

            _column(
                "product",
                "Producto",
            ),

            _column(
                "movement_type",
                "Movimiento",
            ),

            _column(
                "quantity",
                "Cantidad",
                "number",
            ),

            _column(
                "reference",
                "Referencia",
            ),

            _column(
                "reason",
                "Motivo",
            ),

            _column(
                "user_name",
                "Usuario",
            ),
        ],

        "rows":
            _serialize_rows(
                rows
            ),
    }


def get_business_report(
    *,
    current_user: dict,
    report_type: BusinessReportType,
    start_date: date,
    end_date: date,
    branch_id: UUID | None = None,
) -> BusinessReportResponse:

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

    effective_branch_id = (
        branch_id
        if report_type
        in BRANCH_REPORT_TYPES
        else None
    )

    branch_name = (
        "Todas las sucursales"
    )

    with engine.connect() as connection:

        if effective_branch_id is not None:
            branch = _verify_branch(
                connection,
                company_id=
                    company_id,
                branch_id=
                    effective_branch_id,
            )

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

        if report_type == "sales":
            data = _sales_report(
                connection,
                company_id=
                    company_id,
                start_date=
                    start_date,
                end_date=
                    end_date,
                branch_id=
                    effective_branch_id,
            )

        elif report_type == "branches":
            data = _branches_report(
                connection,
                company_id=
                    company_id,
                start_date=
                    start_date,
                end_date=
                    end_date,
            )

        elif report_type == "products":
            data = _products_report(
                connection,
                company_id=
                    company_id,
                start_date=
                    start_date,
                end_date=
                    end_date,
                branch_id=
                    effective_branch_id,
            )

        elif report_type == "customers":
            data = _customers_report(
                connection,
                company_id=
                    company_id,
                start_date=
                    start_date,
                end_date=
                    end_date,
                branch_id=
                    effective_branch_id,
            )

        elif report_type == "inventory":
            data = _inventory_report(
                connection,
                company_id=
                    company_id,
            )

        elif report_type == "kardex":
            data = _kardex_report(
                connection,
                company_id=
                    company_id,
                start_date=
                    start_date,
                end_date=
                    end_date,
            )

        else:
            raise HTTPException(
                status_code=
                    status.HTTP_400_BAD_REQUEST,

                detail=
                    "Tipo de reporte no soportado.",
            )

    return BusinessReportResponse(
        report_type=
            report_type,

        title=
            data["title"],

        description=
            data["description"],

        branch_id=
            effective_branch_id,

        branch_name=
            branch_name,

        start_date=
            start_date,

        end_date=
            end_date,

        generated_at=
            datetime.now(
                timezone.utc
            ),

        summary=
            data["summary"],

        columns=
            data["columns"],

        rows=
            data["rows"],
    )
