from uuid import UUID

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import (
    INET,
    JSONB,
    UUID as PG_UUID,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    CreatedAtMixin,
    UUIDPrimaryKeyMixin,
)


class AuditLog(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "audit_logs"

    company_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
    )

    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
    )

    action: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    table_name: Mapped[str | None] = mapped_column(String)

    record_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True)
    )

    old_data: Mapped[dict | None] = mapped_column(JSONB)

    new_data: Mapped[dict | None] = mapped_column(JSONB)

    ip_address: Mapped[str | None] = mapped_column(INET)

    user_agent: Mapped[str | None] = mapped_column(Text)
