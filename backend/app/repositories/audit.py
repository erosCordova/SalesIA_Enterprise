import json
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.engine import Connection


def list_audit_logs(
    connection: Connection,
    company_id: UUID,
    limit: int = 500,
):
    return connection.execute(
        text(
            """
            SELECT
                a.id,
                a.company_id,
                a.user_id,

                COALESCE(
                    NULLIF(
                        TRIM(
                            CONCAT_WS(
                                ' ',
                                u.first_name,
                                u.last_name
                            )
                        ),
                        ''
                    ),
                    'Sistema'
                ) AS user_name,

                r.name AS user_role,

                a.action,
                a.table_name,
                a.record_id,

                a.old_data,
                a.new_data,

                CAST(
                    a.ip_address AS TEXT
                ) AS ip_address,

                a.user_agent,
                a.created_at

            FROM audit_logs a

            LEFT JOIN users u
                ON u.id = a.user_id
               AND u.company_id = a.company_id

            LEFT JOIN roles r
                ON r.id = u.role_id

            WHERE a.company_id = :company_id

            ORDER BY
                a.created_at DESC,
                a.id DESC

            LIMIT :limit
            """
        ),
        {
            "company_id": company_id,
            "limit": limit,
        },
    ).mappings().all()


def insert_audit_log(
    connection: Connection,
    *,
    company_id,
    user_id,
    action: str,
    table_name: str | None,
    record_id=None,
    old_data: dict | None = None,
    new_data: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    audit_id = uuid4()

    connection.execute(
        text(
            """
            INSERT INTO audit_logs (
                id,
                company_id,
                user_id,
                action,
                table_name,
                record_id,
                old_data,
                new_data,
                ip_address,
                user_agent,
                created_at
            )
            VALUES (
                :id,
                :company_id,
                :user_id,
                :action,
                :table_name,
                :record_id,
                CAST(:old_data AS JSONB),
                CAST(:new_data AS JSONB),
                CAST(:ip_address AS INET),
                :user_agent,
                NOW()
            )
            """
        ),
        {
            "id":
                audit_id,

            "company_id":
                company_id,

            "user_id":
                user_id,

            "action":
                action,

            "table_name":
                table_name,

            "record_id":
                record_id,

            "old_data":
                (
                    json.dumps(
                        old_data,
                        ensure_ascii=False,
                        default=str,
                    )
                    if old_data is not None
                    else None
                ),

            "new_data":
                (
                    json.dumps(
                        new_data,
                        ensure_ascii=False,
                        default=str,
                    )
                    if new_data is not None
                    else None
                ),

            "ip_address":
                ip_address,

            "user_agent":
                user_agent,
        },
    )

    return audit_id
