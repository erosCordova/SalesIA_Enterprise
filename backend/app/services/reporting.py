
import json

from sqlalchemy import text

from app.core.database import engine
from app.services.audit import record_critical_action
from app.repositories.reporting import (
    list_insights,
    list_reports,
)
from app.schemas.reporting import (
    InsightListItem,
    ReportListItem,
)


def get_insights(
    current_user: dict,
) -> list[InsightListItem]:
    with engine.connect() as connection:
        rows = list_insights(
            connection,
            current_user["company_id"],
        )

    return [
        InsightListItem(**dict(row))
        for row in rows
    ]


def get_reports(
    current_user: dict,
) -> list[ReportListItem]:
    with engine.connect() as connection:
        rows = list_reports(
            connection,
            current_user["company_id"],
        )

    return [
        ReportListItem(**dict(row))
        for row in rows
    ]

from datetime import date
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.database import engine

from app.repositories.reporting import (
    get_customers_report,
    get_employees_report,
    get_products_report,
    get_sales_report,
    get_statistical_report,
)

from app.schemas.reporting import (
    ReportGenerateRequest,
    ReportListItem,
)

from app.utils.report_files import (
    generate_csv,
)

def generate_report(
    data: ReportGenerateRequest,
    current_user: dict,
) -> ReportListItem:
    if (
        data.start_date
        and data.end_date
        and data.start_date > data.end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "La fecha inicial no puede "
                "ser posterior a la fecha final."
            ),
        )

    report_id = uuid4()

    report_name = (
        data.name
        or {
            "sales": "Reporte de ventas",
            "statistical": "Reporte estadístico",
            "products": "Reporte de productos",
            "customers": "Reporte de clientes",
            "employees": "Reporte de vendedores",
        }[data.report_type]
    )

    with engine.begin() as connection:

        if data.report_type == "sales":
            rows = get_sales_report(
                connection,
                company_id=current_user["company_id"],
                start_date=data.start_date,
                end_date=data.end_date,
                employee_id=data.employee_id,
                category_id=data.category_id,
            )

            export_rows = [
                dict(row)
                for row in rows
            ]

        elif data.report_type == "statistical":
            result = get_statistical_report(
                connection,
                company_id=current_user["company_id"],
                start_date=data.start_date,
                end_date=data.end_date,
            )

            export_rows = [
                dict(result)
            ]

        elif data.report_type == "products":
            rows = get_products_report(
                connection,
                company_id=current_user["company_id"],
                start_date=data.start_date,
                end_date=data.end_date,
            )

            export_rows = [
                dict(row)
                for row in rows
            ]

        elif data.report_type == "customers":
            rows = get_customers_report(
                connection,
                company_id=current_user["company_id"],
                start_date=data.start_date,
                end_date=data.end_date,
            )

            export_rows = [
                dict(row)
                for row in rows
            ]

        else:
            rows = get_employees_report(
                connection,
                company_id=current_user["company_id"],
                start_date=data.start_date,
                end_date=data.end_date,
            )

            export_rows = [
                dict(row)
                for row in rows
            ]

        generate_csv(
            str(report_id),
            export_rows,
        )

        parameters = {
            "start_date": (
                data.start_date.isoformat()
                if data.start_date
                else None
            ),
            "end_date": (
                data.end_date.isoformat()
                if data.end_date
                else None
            ),
            "employee_id": (
                str(data.employee_id)
                if data.employee_id
                else None
            ),
            "category_id": (
                str(data.category_id)
                if data.category_id
                else None
            ),
        }

        file_url = (
            f"/api/v1/reports/"
            f"{report_id}/download"
        )

        row = connection.execute(
            text("""
                INSERT INTO reports (
                    id,
                    company_id,
                    created_by,
                    name,
                    report_type,
                    parameters,
                    file_url,
                    status
                )
                VALUES (
                    :id,
                    :company_id,
                    :created_by,
                    :name,
                    :report_type,
                    CAST(:parameters AS jsonb),
                    :file_url,
                    'ready'
                )
                RETURNING
                    id,
                    name,
                    report_type,
                    parameters,
                    file_url,
                    status,
                    created_at
            """),
            {
                "id": report_id,
                "company_id": current_user["company_id"],
                "created_by": current_user["id"],
                "name": report_name,
                "report_type": data.report_type,
                "parameters": json.dumps(
                    parameters
                ),
                "file_url": file_url,
            },
        ).mappings().one()
        record_critical_action(
            connection, current_user,
            action="report.generated", table_name="reports",
            record_id=report_id,
            details={"report_type": data.report_type},
        )

    return ReportListItem(
        **dict(row)
    )
