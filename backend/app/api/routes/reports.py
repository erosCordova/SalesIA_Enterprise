from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from pathlib import Path
from uuid import UUID

from fastapi.responses import FileResponse

from app.api.dependencies.auth import get_current_user, require_permission
from app.schemas.reporting import (
    ReportGenerateRequest,
    ReportListItem,
)
from app.services.reporting import (
    generate_report,
    get_reports,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[ReportListItem],
    summary="Consultar reportes",
)
def list_reports(
    current_user: dict = Depends(
        require_permission("reports.read")
    ),
):
    return get_reports(current_user)


@router.get(
    "/status",
    summary="Estado del módulo de reportes",
)
def reports_status(
    current_user: dict = Depends(get_current_user),
):
    return {
        "module": "Reportes",
        "status": "ready",
    }


# --- EL NUEVO CÓDIGO VA AQUÍ ---
@router.post(
    "/generate",
    response_model=ReportListItem,
    status_code=status.HTTP_201_CREATED,
    summary="Generar reporte",
)
def create_report(
    data: ReportGenerateRequest,
    current_user: dict = Depends(
        require_permission("reports.generate")
    ),
):
    return generate_report(
        data,
        current_user,
    )

@router.get(
    "/{report_id}/download",
    summary="Descargar reporte",
)
def download_report(
    report_id: UUID,
    current_user: dict = Depends(
        require_permission("reports.download")
    ),
):
    from app.core.database import engine
    from sqlalchemy import text

    with engine.connect() as connection:
        row = connection.execute(
            text("""
                SELECT
                    id,
                    file_url
                FROM reports
                WHERE id = :report_id
                  AND company_id = :company_id
                LIMIT 1
            """),
            {
                "report_id": report_id,
                "company_id": current_user["company_id"],
            },
        ).mappings().first()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Reporte no encontrado.",
        )

    from app.utils.report_files import REPORTS_DIR

    file_path = (
        REPORTS_DIR /
        f"{report_id}.csv"
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Archivo del reporte no encontrado.",
        )

    from app.services.audit import record_critical_action

    with engine.begin() as connection:
        record_critical_action(
            connection, current_user,
            action="report.downloaded", table_name="reports",
            record_id=report_id,
            details={"format": "csv"},
        )

    return FileResponse(
        path=file_path,
        filename=f"salesia-report-{report_id}.csv",
        media_type="text/csv",
    )
