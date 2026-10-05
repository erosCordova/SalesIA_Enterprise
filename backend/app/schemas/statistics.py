from typing import Annotated
from datetime import date

from pydantic import BaseModel, Field, FiniteFloat, field_validator, model_validator


class NumericValuesRequest(BaseModel):
    values: list[FiniteFloat] = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Entre 1 y 1000 valores numéricos finitos.",
    )


class MeanResponse(BaseModel):
    count: int
    mean: float


class MedianResponse(BaseModel):
    count: int
    median: float


class CompareStatisticsResponse(BaseModel):
    count: int
    mean: float
    median: float
    difference: float
    interpretation: str


class BayesRequest(BaseModel):
    event_a: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    event_b: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    probability_a: Annotated[FiniteFloat, Field(
        ...,
        ge=0,
        le=1,
    )]

    probability_b_given_a: Annotated[FiniteFloat, Field(
        ...,
        ge=0,
        le=1,
    )]

    probability_b: Annotated[FiniteFloat, Field(
        ...,
        gt=0,
        le=1,
    )]

    @field_validator("event_a", "event_b", mode="before")
    @classmethod
    def strip_event_names(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @model_validator(mode="after")
    def validate_probability_consistency(self):
        joint_probability = self.probability_a * self.probability_b_given_a
        if joint_probability > self.probability_b + 1e-12:
            raise ValueError(
                "Los valores no son compatibles: P(B) debe ser igual o mayor "
                "que P(A) × P(B|A)."
            )
        return self


class BayesResponse(BaseModel):
    event_a: str
    event_b: str

    probability_a: float
    probability_b_given_a: float
    probability_b: float

    posterior_probability: float

    formula: str
    interpretation: str


class RandomVariableRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    values: list[FiniteFloat] = Field(
        ...,
        min_length=1,
        max_length=1000,
    )

    probabilities: list[FiniteFloat] = Field(
        ...,
        min_length=1,
        max_length=1000,
    )

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @model_validator(mode="after")
    def validate_distribution(self):
        if len(self.values) != len(self.probabilities):
            raise ValueError(
                "values y probabilities deben tener la misma longitud."
            )

        if any(
            probability < 0 or probability > 1
            for probability in self.probabilities
        ):
            raise ValueError(
                "Todas las probabilidades deben estar entre 0 y 1."
            )

        total = sum(self.probabilities)

        if abs(total - 1.0) > 0.000001:
            raise ValueError(
                "La suma de probabilidades debe ser igual a 1."
            )

        return self


class RandomVariableResponse(BaseModel):
    name: str

    expected_value: float
    variance: float
    standard_deviation: float

    observations: int
class SalesStatisticsRequest(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.start_date > self.end_date
        ):
            raise ValueError(
                "La fecha inicial no puede ser posterior a la fecha final."
            )
        return self


class SalesStatisticsResponse(BaseModel):
    start_date: date | None
    end_date: date | None
    count: int
    mean: float
    median: float
    difference: float
    interpretation: str
