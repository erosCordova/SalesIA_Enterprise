
from decimal import Decimal
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


def get_summary(
    connection: Connection,
    *,
    company_id: UUID,
    sales_user_id: UUID | None = None,
    include_sales: bool = True,
):
    connection.execute(text("SET LOCAL TIME ZONE 'America/Lima'"))

    params = {
        "company_id": company_id,
        "sales_user_id": sales_user_id,
    }

    # Filtro común: empresa, vendedor (si aplica) y periodo.
    sales_filter = """
        s.company_id = :company_id
        AND s.status = 'completed'
        AND s.sale_date >= CURRENT_DATE - INTERVAL '29 days'
        AND s.sale_date < CURRENT_DATE + INTERVAL '1 day'
    """

    if sales_user_id is not None:
        sales_filter += " AND s.created_by = :sales_user_id"

    if include_sales:
        sales = connection.execute(
            text(f"""
                SELECT
                    COUNT(*) AS sales_count,
                    COALESCE(SUM(s.total), 0) AS revenue,
                    COALESCE(AVG(s.total), 0) AS average_ticket
                FROM sales s
                WHERE {sales_filter}
            """),
            params,
        ).mappings().one()

        previous_filter = """
            s.company_id = :company_id
            AND s.status = 'completed'
            AND s.sale_date >= CURRENT_DATE - INTERVAL '59 days'
            AND s.sale_date < CURRENT_DATE - INTERVAL '29 days'
        """

        if sales_user_id is not None:
            previous_filter += " AND s.created_by = :sales_user_id"

        previous_revenue = connection.execute(
            text(f"""
                SELECT COALESCE(SUM(s.total), 0)
                FROM sales s
                WHERE {previous_filter}
            """),
            params,
        ).scalar_one()

        current_revenue = Decimal(str(sales["revenue"]))
        previous_revenue = Decimal(str(previous_revenue))

        if previous_revenue > 0:
            growth = (
                (current_revenue - previous_revenue)
                / previous_revenue
                * Decimal("100")
            )
        else:
            growth = Decimal("0")

        daily_rows = connection.execute(
            text(f"""
                SELECT
                    d.day::date AS day,
                    COUNT(s.id) AS sales,
                    COALESCE(SUM(s.total), 0) AS revenue
                FROM generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS d(day)
                LEFT JOIN sales s
                    ON s.sale_date >= d.day
                    AND s.sale_date < d.day + INTERVAL '1 day'
                    AND {sales_filter}
                GROUP BY d.day
                ORDER BY d.day
            """),
            params,
        ).mappings().all()

        recent_rows = connection.execute(
            text(f"""
                SELECT
                    s.id,
                    s.sale_number,
                    COALESCE(
                        NULLIF(
                            TRIM(CONCAT_WS(
                                ' ',
                                c.first_name,
                                c.last_name
                            )),
                            ''
                        ),
                        c.business_name,
                        'Cliente no especificado'
                    ) AS customer_name,
                    s.sale_date,
                    s.total,
                    s.status
                FROM sales s
                LEFT JOIN customers c
                    ON c.id = s.customer_id
                    AND c.company_id = s.company_id
                WHERE {sales_filter}
                ORDER BY s.sale_date DESC
                LIMIT 10
            """),
            params,
        ).mappings().all()
    else:
        sales = {
            "sales_count": 0,
            "revenue": Decimal("0"),
            "average_ticket": Decimal("0"),
        }
        growth = Decimal("0")
        daily_rows = []
        recent_rows = []

    if sales_user_id is not None:
        active_customers_query = text("""
        SELECT COUNT(DISTINCT s.customer_id)
        FROM sales s
        WHERE s.company_id = :company_id
          AND s.created_by = :sales_user_id
          AND s.status = 'completed'
          AND s.customer_id IS NOT NULL
          AND EXISTS (
              SELECT 1
              FROM customers c
              WHERE c.id = s.customer_id
                AND c.company_id = :company_id
                AND c.status = 'active'
          )
         """)
        active_customers = connection.execute(
            active_customers_query,
        {
            "company_id": company_id,
            "sales_user_id": sales_user_id,
        },
        ).scalar_one()
    else:
        active_customers = connection.execute(
            text("""
                SELECT COUNT(*)
                FROM customers
                WHERE company_id = :company_id
                AND status = 'active'
            """),
            {"company_id": company_id},
        ).scalar_one()

    products_count = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM products
            WHERE company_id = :company_id
            AND status = 'active'
        """),
        {"company_id": company_id},
    ).scalar_one()

    low_stock_count = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM inventory
            WHERE company_id = :company_id
              AND stock_quantity <= minimum_stock
        """),
        {"company_id": company_id},
    ).scalar_one()

    stock_rows = connection.execute(
        text("""
            SELECT
                p.name AS product_name,
                i.stock_quantity,
                CASE
                    WHEN i.stock_quantity <= 0 THEN 'Agotado'
                    ELSE 'Stock bajo'
                END AS stock_status
            FROM inventory i
            JOIN products p
                ON p.id = i.product_id
                AND p.company_id = i.company_id
            WHERE i.company_id = :company_id
              AND i.stock_quantity <= i.minimum_stock
            ORDER BY i.stock_quantity ASC
            LIMIT 10
        """),
        {"company_id": company_id},
    ).mappings().all()

    return {
        "sales_count": int(sales["sales_count"]),
        "revenue": sales["revenue"],
        "average_ticket": sales["average_ticket"],
        "active_customers": int(active_customers),
        "products_count": int(products_count),
        "low_stock_count": int(low_stock_count),
        "growth_percentage": growth,
        "sales_by_day": [
            {
                "day": row["day"],
                "sales": int(row["sales"]),
                "revenue": row["revenue"],
            }
            for row in daily_rows
        ],
        "recent_sales": [
            {
                "id": str(row["id"]),
                "sale_number": row["sale_number"],
                "customer_name": row["customer_name"],
                "sale_date": row["sale_date"],
                "total": row["total"],
                "status": row["status"],
            }
            for row in recent_rows
        ],
        "stock_alerts": [
            {
                "product_name": row["product_name"],
                "stock_quantity": row["stock_quantity"],
                "stock_status": row["stock_status"],
            }
            for row in stock_rows
        ],
    }
