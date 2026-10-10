from datetime import date
from uuid import UUID

from pydantic import BaseModel


class SalesDistributionBin(BaseModel):
    label: str
    lower_bound: float
    upper_bound: float
    count: int


class SalesBusinessStatisticsResponse(BaseModel):
    branch_id: UUID | None
    branch_name: str

    start_date: date
    end_date: date

    count: int
    total_revenue: float

    mean: float
    median: float

    variance: float
    standard_deviation: float

    minimum: float
    maximum: float
    range_value: float

    q1: float
    q3: float
    iqr: float

    coefficient_variation: float

    variability_label: str
    interpretation: str

    distribution: list[SalesDistributionBin]
