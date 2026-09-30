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
    if include_sales:
        sales_filter = """
            WHERE company_id = :company_id
        """

        params = {
            "company_id": company_id,
        }

        if sales_user_id is not None:
            sales_filter += """
                AND created_by = :sales_user_id
            """

            params["sales_user_id"] = sales_user_id

        sales = connection.execute(
            text(f"""
                SELECT
                    COUNT(*) AS sales_count,
                    COALESCE(SUM(total), 0) AS revenue,
                    COALESCE(AVG(total), 0) AS average_ticket
                FROM sales
                {sales_filter}
            """),
            params,
        ).mappings().one()
    else:
        sales = {
            "sales_count": 0,
            "revenue": Decimal("0"),
            "average_ticket": Decimal("0"),
        }

    active_customers = connection.execute(
        text("""
            SELECT COUNT(*) AS count
            FROM customers
            WHERE company_id = :company_id
              AND status = 'active'
        """),
        {
            "company_id": company_id,
        },
    ).scalar_one()

    products_count = connection.execute(
        text("""
            SELECT COUNT(*) AS count
            FROM products
            WHERE company_id = :company_id
              AND status = 'active'
        """),
        {
            "company_id": company_id,
        },
    ).scalar_one()

    low_stock_count = connection.execute(
        text("""
            SELECT COUNT(*) AS count
            FROM inventory
            WHERE company_id = :company_id
              AND stock_quantity <= minimum_stock
        """),
        {
            "company_id": company_id,
        },
    ).scalar_one()

    return {
        "sales_count": int(sales["sales_count"]),
        "revenue": sales["revenue"],
        "average_ticket": sales["average_ticket"],
        "active_customers": int(active_customers),
        "products_count": int(products_count),
        "low_stock_count": int(low_stock_count),
    }
