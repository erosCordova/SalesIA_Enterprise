from sqlalchemy import text
from sqlalchemy.engine import Connection


def list_manuals(
    connection: Connection,
):
    return connection.execute(
        text("""
            SELECT
                manual_type,
                title,
                file_name,
                mime_type,
                size_bytes,
                created_at,
                updated_at
            FROM system_manuals
            ORDER BY
                CASE manual_type
                    WHEN 'user' THEN 1
                    WHEN 'technical' THEN 2
                    ELSE 3
                END
        """)
    ).mappings().all()


def get_manual(
    connection: Connection,
    manual_type: str,
):
    return connection.execute(
        text("""
            SELECT
                manual_type,
                title,
                file_name,
                mime_type,
                size_bytes,
                content,
                created_at,
                updated_at
            FROM system_manuals
            WHERE manual_type = :manual_type
            LIMIT 1
        """),
        {
            "manual_type":
                manual_type,
        },
    ).mappings().first()


def update_manual_title(
    connection: Connection,
    *,
    manual_type: str,
    title: str,
    updated_by: str | None,
):
    return connection.execute(
        text("""
            UPDATE system_manuals
            SET
                title = :title,
                updated_by = :updated_by,
                updated_at = CURRENT_TIMESTAMP
            WHERE manual_type = :manual_type
            RETURNING
                manual_type,
                title,
                file_name,
                mime_type,
                size_bytes,
                created_at,
                updated_at
        """),
        {
            "manual_type":
                manual_type,

            "title":
                title,

            "updated_by":
                updated_by,
        },
    ).mappings().first()


def upsert_manual(
    connection: Connection,
    *,
    manual_type: str,
    title: str,
    file_name: str,
    mime_type: str,
    size_bytes: int,
    content: bytes,
    updated_by: str | None,
):
    return connection.execute(
        text("""
            INSERT INTO system_manuals (
                manual_type,
                title,
                file_name,
                mime_type,
                size_bytes,
                content,
                updated_by
            )
            VALUES (
                :manual_type,
                :title,
                :file_name,
                :mime_type,
                :size_bytes,
                :content,
                :updated_by
            )
            ON CONFLICT (
                manual_type
            )
            DO UPDATE SET
                title =
                    EXCLUDED.title,

                file_name =
                    EXCLUDED.file_name,

                mime_type =
                    EXCLUDED.mime_type,

                size_bytes =
                    EXCLUDED.size_bytes,

                content =
                    EXCLUDED.content,

                updated_by =
                    EXCLUDED.updated_by,

                updated_at =
                    CURRENT_TIMESTAMP
            RETURNING
                manual_type,
                title,
                file_name,
                mime_type,
                size_bytes,
                created_at,
                updated_at
        """),
        {
            "manual_type":
                manual_type,

            "title":
                title,

            "file_name":
                file_name,

            "mime_type":
                mime_type,

            "size_bytes":
                size_bytes,

            "content":
                content,

            "updated_by":
                updated_by,
        },
    ).mappings().one()


def delete_manual(
    connection: Connection,
    manual_type: str,
):
    return connection.execute(
        text("""
            DELETE FROM system_manuals
            WHERE manual_type = :manual_type
            RETURNING manual_type
        """),
        {
            "manual_type":
                manual_type,
        },
    ).mappings().first()
