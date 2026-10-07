from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)


class CustomerAccountBase(BaseModel):
    document_type: str = Field(
        default="DNI",
        min_length=2,
        max_length=20,
    )

    document_number: str = Field(
        ...,
        min_length=8,
        max_length=20,
    )

    first_name: str | None = Field(
        default=None,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        max_length=100,
    )

    business_name: str | None = Field(
        default=None,
        max_length=200,
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

    status: str = Field(
        default="active",
        pattern=r"^(active|inactive)$",
    )

    @model_validator(
        mode="after",
    )
    def validate_customer_name(self):
        values = [
            self.first_name,
            self.last_name,
            self.business_name,
        ]

        if not any(
            value
            and value.strip()
            for value in values
        ):
            raise ValueError(
                "Debe indicar el nombre o razón social del cliente."
            )

        return self


class CustomerAccountCreateRequest(
    CustomerAccountBase
):
    access_dni: str = Field(
        ...,
        min_length=8,
        max_length=8,
        pattern=r"^[0-9]{8}$",
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


class CustomerAccountUpdateRequest(
    CustomerAccountBase
):
    access_dni: str = Field(
        ...,
        min_length=8,
        max_length=8,
        pattern=r"^[0-9]{8}$",
    )

    new_password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )


class CustomerAccountResponse(BaseModel):
    id: UUID

    document_type: str | None
    document_number: str | None

    first_name: str | None
    last_name: str | None
    business_name: str | None

    email: str | None
    phone: str | None

    address: str | None
    city: str | None

    status: str

    access_dni: str | None = None
    access_enabled: bool = False


class ClientSaleItem(BaseModel):
    id: UUID
    sale_number: str
    sale_date: datetime
    total: Decimal
    status: str


class ClientPortalResponse(BaseModel):
    customer: CustomerAccountResponse

    sales_count: int
    total_spent: Decimal
    last_sale_at: datetime | None

    recent_sales: list[
        ClientSaleItem
    ]
