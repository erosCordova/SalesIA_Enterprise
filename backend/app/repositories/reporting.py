from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection
import json
from typing import Any


def list_insights(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                id,
                title,
                description,
                insight_type,
                severity,
                evidence,
                status,
                created_at
            FROM insights
            WHERE company_id = :company_id
            ORDER BY created_at DESC
            LIMIT 200
        """),
        {
            "company_id": company_id,
        },
    ).mappings().all()


def list_reports(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                id,
                name,
                report_type,
                parameters,
                file_url,
                status,
                created_at
            FROM reports
            WHERE company_id = :company_id
            ORDER BY created_at DESC
            LIMIT 200
        """),
        {
            "company_id": company_id,
        },
    ).mappings().all()

def create_insight_if_missing(
    connection: Connection,
    company_id: UUID,
    title: str,
    description: str,
    insight_type: str,
    severity: str,
    evidence: dict[str, Any],
):
    params = {
        "company_id": company_id,
        "title": title,
        "description": description,
        "insight_type": insight_type,
        "severity": severity,
        "evidence": json.dumps(evidence, default=str),
    }

    # Evita crear repetidamente el mismo insight activo
    # durante el mismo día para una empresa.
    existing = connection.execute(
        text("""
            SELECT
                id,
                title,
                description,
                insight_type,
                severity,
                evidence,
                status,
                created_at
            FROM insights
            WHERE company_id = :company_id
              AND title = :title
              AND status = 'active'
              AND created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
            ORDER BY created_at DESC
            LIMIT 1
        """),
        params,
    ).mappings().first()

    if existing:
        return existing

    return connection.execute(
        text("""
            INSERT INTO insights (
                company_id,
                title,
                description,
                insight_type,
                severity,
                evidence,
                status
            )
            VALUES (
                :company_id,
                :title,
                :description,
                :insight_type,
                :severity,
                CAST(:evidence AS jsonb),
                'active'
            )
            RETURNING
                id,
                title,
                description,
                insight_type,
                severity,
                evidence,
                status,
                created_at
        """),
        params,
    ).mappings().one()

def get_sales_report(
    connection: Connection,
    *,
    company_id: UUID,
    start_date=None,
    end_date=None,
    employee_id=None,
    category_id=None,
):
    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": company_id,
    }

    if start_date:
        filters.append(
            "s.sale_date >= :start_date"
        )
        params["start_date"] = start_date

    if end_date:
        filters.append(
            "s.sale_date < (:end_date::date + INTERVAL '1 day')"
        )
        params["end_date"] = end_date

    if employee_id:
        filters.append(
            "s.employee_id = :employee_id"
        )
        params["employee_id"] = employee_id

    if category_id:
        filters.append("""
            EXISTS (
                SELECT 1
                FROM sale_details sd_filter
                INNER JOIN products p_filter
                    ON p_filter.id = sd_filter.product_id
                WHERE sd_filter.sale_id = s.id
                  AND p_filter.category_id = :category_id
            )
        """)
        params["category_id"] = category_id

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT
            s.sale_number,
            s.sale_date,
            COALESCE(
                CONCAT(c.first_name, ' ', c.last_name),
                c.business_name,
                'Sin cliente'
            ) AS customer,
            COALESCE(
                CONCAT(e.first_name, ' ', e.last_name),
                'Sin vendedor'
            ) AS employee,
            s.subtotal,
            s.discount,
            s.tax,
            s.total,
            s.status
        FROM sales s
        LEFT JOIN customers c
            ON c.id = s.customer_id
        LEFT JOIN employees e
            ON e.id = s.employee_id
        WHERE {where_clause}
        ORDER BY s.sale_date DESC
    """)

    return connection.execute(
        query,
        params,
    ).mappings().all()
    
def get_statistical_report(
    connection: Connection,
    *,
    company_id: UUID,
    start_date=None,
    end_date=None,
):
    filters = [
        "company_id = :company_id",
        "status = 'completed'",
    ]

    params = {
        "company_id": company_id,
    }

    if start_date:
        filters.append(
            "sale_date >= :start_date"
        )
        params["start_date"] = start_date

    if end_date:
        filters.append(
            "sale_date < (:end_date::date + INTERVAL '1 day')"
        )
        params["end_date"] = end_date

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT
            COUNT(*) AS total_sales,
            COALESCE(SUM(total), 0) AS total_revenue,
            COALESCE(AVG(total), 0) AS average_sale,
            COALESCE(
                percentile_cont(0.5)
                WITHIN GROUP (ORDER BY total),
                0
            ) AS median_sale,
            COALESCE(MIN(total), 0) AS minimum_sale,
            COALESCE(MAX(total), 0) AS maximum_sale
        FROM sales
        WHERE {where_clause}
    """)

    return connection.execute(
        query,
        params,
    ).mappings().one()
    
def get_products_report(
    connection: Connection,
    *,
    company_id: UUID,
    start_date=None,
    end_date=None,
):
    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": company_id,
    }

    if start_date:
        filters.append(
            "s.sale_date >= :start_date"
        )
        params["start_date"] = start_date

    if end_date:
        filters.append(
            "s.sale_date < (:end_date::date + INTERVAL '1 day')"
        )
        params["end_date"] = end_date

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT
            p.sku,
            p.name AS product,
            COALESCE(cat.name, 'Sin categoría') AS category,
            COALESCE(SUM(sd.quantity), 0) AS quantity_sold,
            COALESCE(SUM(sd.subtotal), 0) AS revenue
        FROM sale_details sd
        INNER JOIN sales s
            ON s.id = sd.sale_id
        INNER JOIN products p
            ON p.id = sd.product_id
        LEFT JOIN categories cat
            ON cat.id = p.category_id
        WHERE {where_clause}
        GROUP BY
            p.sku,
            p.name,
            cat.name
        ORDER BY revenue DESC
    """)

    return connection.execute(
        query,
        params,
    ).mappings().all()
    
def get_customers_report(
    connection: Connection,
    *,
    company_id: UUID,
    start_date=None,
    end_date=None,
):
    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": company_id,
    }

    if start_date:
        filters.append(
            "s.sale_date >= :start_date"
        )
        params["start_date"] = start_date

    if end_date:
        filters.append(
            "s.sale_date < (:end_date::date + INTERVAL '1 day')"
        )
        params["end_date"] = end_date

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT
            c.id,
            COALESCE(
                NULLIF(
                    CONCAT(
                        c.first_name,
                        ' ',
                        c.last_name
                    ),
                    ' '
                ),
                c.business_name,
                'Sin nombre'
            ) AS customer,
            COUNT(s.id) AS purchases,
            COALESCE(SUM(s.total), 0) AS total_spent,
            COALESCE(AVG(s.total), 0) AS average_ticket
        FROM sales s
        INNER JOIN customers c
            ON c.id = s.customer_id
        WHERE {where_clause}
        GROUP BY
            c.id,
            c.first_name,
            c.last_name,
            c.business_name
        ORDER BY total_spent DESC
    """)

    return connection.execute(
        query,
        params,
    ).mappings().all()
    
def get_employees_report(
    connection: Connection,
    *,
    company_id: UUID,
    start_date=None,
    end_date=None,
):
    filters = [
        "s.company_id = :company_id",
        "s.status = 'completed'",
    ]

    params = {
        "company_id": company_id,
    }

    if start_date:
        filters.append(
            "s.sale_date >= :start_date"
        )
        params["start_date"] = start_date

    if end_date:
        filters.append(
            "s.sale_date < (:end_date::date + INTERVAL '1 day')"
        )
        params["end_date"] = end_date

    where_clause = " AND ".join(filters)

    query = text(f"""
        SELECT
            e.id,
            CONCAT(
                e.first_name,
                ' ',
                e.last_name
            ) AS employee,
            COUNT(s.id) AS sales_count,
            COALESCE(SUM(s.total), 0) AS revenue,
            COALESCE(AVG(s.total), 0) AS average_ticket
        FROM sales s
        INNER JOIN employees e
            ON e.id = s.employee_id
        WHERE {where_clause}
        GROUP BY
            e.id,
            e.first_name,
            e.last_name
        ORDER BY revenue DESC
    """)

    return connection.execute(
        query,
        params,
    ).mappings().all()