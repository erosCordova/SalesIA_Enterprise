from uuid import UUID

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    CreatedAtMixin,
    UUIDPrimaryKeyMixin,
)


class Insight(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "insights"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    dataset_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("datasets.id"),
    )

    analysis_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("statistical_analyses.id"),
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    insight_type: Mapped[str | None] = mapped_column(String)

    severity: Mapped[str | None] = mapped_column(String)

    evidence: Mapped[dict | None] = mapped_column(JSONB)

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )


class Report(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "reports"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    created_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    report_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    parameters: Mapped[dict | None] = mapped_column(JSONB)

    file_url: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )
