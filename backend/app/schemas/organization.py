from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


StatusValue = Literal[
    "active",
    "inactive",
]


class CompanyResponse(BaseModel):
    id: UUID

    name: str
    business_name: str | None
    tax_id: str | None

    email: str | None
    phone: str | None

    address: str | None
    city: str | None
    country: str | None

    status: str

    created_at: datetime
    updated_at: datetime


class CompanyUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    business_name: str | None = Field(
        default=None,
        max_length=250,
    )

    tax_id: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=200,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    status: StatusValue | None = None


class BranchCreateRequest(BaseModel):
    code: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    department: str | None = Field(
        default=None,
        max_length=100,
    )

    province: str | None = Field(
        default=None,
        max_length=120,
    )

    district: str | None = Field(
        default=None,
        max_length=150,
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    country: str = Field(
        default="Perú",
        min_length=2,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=200,
    )

    status: StatusValue = "active"


class BranchUpdateRequest(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    department: str | None = Field(
        default=None,
        max_length=100,
    )

    province: str | None = Field(
        default=None,
        max_length=120,
    )

    district: str | None = Field(
        default=None,
        max_length=150,
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=200,
    )

    status: StatusValue | None = None


class BranchResponse(BaseModel):
    id: UUID
    company_id: UUID

    code: str
    name: str

    address: str | None
    city: str | None

    department: str | None
    province: str | None
    district: str | None

    latitude: float | None
    longitude: float | None

    country: str | None

    phone: str | None
    email: str | None

    status: str

    created_at: datetime
    updated_at: datetime
