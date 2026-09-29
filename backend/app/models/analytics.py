from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    CreatedAtMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class Dataset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "datasets"

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

    description: Mapped[str | None] = mapped_column(Text)

    source_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    source_reference: Mapped[str | None] = mapped_column(
        String
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )


class DatasetVariable(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "dataset_variables"

    dataset_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("datasets.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    variable_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    data_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    measurement_level: Mapped[str | None] = mapped_column(
        String
    )

    unit: Mapped[str | None] = mapped_column(String)

    description: Mapped[str | None] = mapped_column(Text)


class Observation(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "observations"

    dataset_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("datasets.id"),
        nullable=False,
    )

    variable_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("dataset_variables.id"),
        nullable=False,
    )

    observation_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    numeric_value: Mapped[Decimal | None] = mapped_column(
        Numeric
    )

    text_value: Mapped[str | None] = mapped_column(Text)

    boolean_value: Mapped[bool | None] = mapped_column(Boolean)

    date_value: Mapped[date | None] = mapped_column(Date)

    datetime_value: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )


class StatisticalAnalysis(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "statistical_analyses"

    dataset_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("datasets.id"),
        nullable=False,
    )

    variable_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("dataset_variables.id"),
    )

    executed_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
    )

    analysis_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    name: Mapped[str | None] = mapped_column(String)

    description: Mapped[str | None] = mapped_column(Text)

    parameters: Mapped[dict | None] = mapped_column(JSONB)

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class StatisticalResult(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "statistical_results"

    analysis_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("statistical_analyses.id"),
        nullable=False,
    )

    metric_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    numeric_value: Mapped[Decimal | None] = mapped_column(
        Numeric
    )

    text_value: Mapped[str | None] = mapped_column(Text)

    interpretation: Mapped[str | None] = mapped_column(Text)


class BayesAnalysis(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "bayes_analyses"

    statistical_analysis_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("statistical_analyses.id"),
        nullable=False,
    )

    event_a: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    event_b: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    probability_a: Mapped[Decimal | None] = mapped_column(
        Numeric
    )

    probability_b_given_a: Mapped[
        Decimal | None
    ] = mapped_column(Numeric)

    probability_b: Mapped[Decimal | None] = mapped_column(
        Numeric
    )

    posterior_probability: Mapped[
        Decimal | None
    ] = mapped_column(Numeric)

    interpretation: Mapped[str | None] = mapped_column(Text)


class RandomVariable(
    UUIDPrimaryKeyMixin,
    CreatedAtMixin,
    Base,
):
    __tablename__ = "random_variables"

    dataset_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("datasets.id"),
        nullable=False,
    )

    variable_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("dataset_variables.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    variable_kind: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    probability_model: Mapped[str | None] = mapped_column(
        String
    )

    parameters: Mapped[dict | None] = mapped_column(JSONB)

    description: Mapped[str | None] = mapped_column(Text)
