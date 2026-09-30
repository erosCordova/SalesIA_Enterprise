from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


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
