from uuid import UUID

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
