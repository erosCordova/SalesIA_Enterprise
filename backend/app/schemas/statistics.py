from pydantic import BaseModel, Field, model_validator


class NumericValuesRequest(BaseModel):
    values: list[float] = Field(
        ...,
        min_length=1,
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

    probability_a: float = Field(
        ...,
        ge=0,
        le=1,
    )

    probability_b_given_a: float = Field(
        ...,
        ge=0,
        le=1,
    )

    probability_b: float = Field(
        ...,
        gt=0,
        le=1,
    )


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

    values: list[float] = Field(
        ...,
        min_length=1,
    )

    probabilities: list[float] = Field(
        ...,
        min_length=1,
    )

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
