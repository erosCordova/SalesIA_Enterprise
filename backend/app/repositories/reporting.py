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