from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import strip_string_fields, validate_optional_email


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

    @model_validator(mode="before")
    @classmethod
    def trim_text_fields(cls, value):
        return strip_string_fields(value)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value):
        return validate_optional_email(value)


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

    @model_validator(mode="before")
    @classmethod
    def trim_text_fields(cls, value):
        return strip_string_fields(value)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value):
        return validate_optional_email(value)


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

    @model_validator(mode="before")
    @classmethod
    def trim_text_fields(cls, value):
        return strip_string_fields(value)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value):
        return validate_optional_email(value)


class BranchResponse(BaseModel):
    id: UUID
    company_id: UUID

    code: str
    name: str

    address: str | None
    city: str | None
    country: str | None

    phone: str | None
    email: str | None

    status: str

    created_at: datetime
    updated_at: datetime
