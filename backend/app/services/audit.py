import json
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


def record_critical_action(
    connection: Connection,
    current_user: dict,
    *,
    action: str,
    table_name: str,
    record_id: UUID | str | None,
    details: dict | None = None,
) -> None:
    """Save a small, non-sensitive audit event in the caller's transaction."""
    connection.execute(
        text("""
            INSERT INTO audit_logs (
                company_id,
                user_id,
                action,
                table_name,
                record_id,
                new_data
            ) VALUES (
                :company_id,
                :user_id,
                :action,
                :table_name,
                :record_id,
                CAST(:new_data AS jsonb)
            )
        """),
        {
            "company_id": current_user["company_id"],
            "user_id": current_user["id"],
            "action": action,
            "table_name": table_name,
            "record_id": record_id,
            "new_data": json.dumps(details) if details is not None else None,
        },
    )


def list_company_audit_events(
    connection: Connection,
    company_id: UUID,
    limit: int = 100,
) -> list[dict]:
    rows = connection.execute(
        text("""
            SELECT
                a.id,
                a.action,
                a.table_name,
                a.record_id,
                a.created_at,
                u.first_name,
                u.last_name,
                r.name AS role
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.user_id
            LEFT JOIN roles r ON r.id = u.role_id
            WHERE a.company_id = :company_id
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT :limit
        """),
        {"company_id": company_id, "limit": limit},
    ).mappings()

    return [
        {
            "id": str(row["id"]),
            "action": row["action"],
            "table_name": row["table_name"],
            "record_id": str(row["record_id"]) if row["record_id"] else None,
            "created_at": row["created_at"].isoformat(),
            "actor_name": " ".join(
                part for part in (row["first_name"], row["last_name"]) if part
            ) or "Usuario eliminado",
            "actor_role": row["role"],
        }
        for row in rows
    ]
