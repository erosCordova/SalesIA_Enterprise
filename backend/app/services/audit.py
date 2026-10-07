from app.core.database import engine
from app.repositories import audit as repository
from app.schemas.audit import AuditLogItem


def get_audit_logs(
    current_user: dict,
    limit: int = 500,
) -> list[AuditLogItem]:
    company_id = current_user["company_id"]

    with engine.connect() as connection:
        rows = repository.list_audit_logs(
            connection,
            company_id=company_id,
            limit=limit,
        )

    return [
        AuditLogItem(
            **dict(row)
        )
        for row in rows
    ]
