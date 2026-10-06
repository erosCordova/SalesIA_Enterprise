from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


StatusValue = Literal[
    "active",
    "inactive",
]

PaymentMethod = Literal[
    "cash",
    "card",
    "transfer",
    "yape",
    "plin",
    "other",
]


class CustomerCreateRequest(BaseModel):
    document_type: str = Field(
        default="RUC",
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

    status: StatusValue = "active"

    @model_validator(mode="after")
    def validate_name(self):
        business = (
            self.business_name.strip()
            if self.business_name
            else ""
        )

        first = (
            self.first_name.strip()
            if self.first_name
            else ""
        )

        last = (
            self.last_name.strip()
            if self.last_name
            else ""
        )

        if not business and not first and not last:
            raise ValueError(
                "Debe indicar razón social o nombre del cliente."
            )

        return self


class CustomerResponse(BaseModel):
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


class CustomerUpdateRequest(BaseModel):
    document_type: str = Field(
        default="RUC",
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

    status: StatusValue = "active"

    @model_validator(mode="after")
    def validate_name(self):
        if not any([
            (self.business_name or "").strip(),
            (self.first_name or "").strip(),
            (self.last_name or "").strip(),
        ]):
            raise ValueError(
                "Debe indicar razón social o nombre del cliente."
            )
        return self


class CustomerHistoryItem(BaseModel):
    id: UUID
    sale_number: str
    sale_date: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    status: str


class CustomerHistoryResponse(BaseModel):
    customer: CustomerResponse
    total_sales: int
    total_amount: Decimal
    last_sale_date: str | None
    sales: list[CustomerHistoryItem]


class CategoryCreateRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=120,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    status: StatusValue = "active"


class CategoryUpdateRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=120,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    status: StatusValue = "active"


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    status: str


class ProductUpdateRequest(BaseModel):
    category_id: UUID | None = None

    sku: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    unit: str = Field(
        default="unidad",
        min_length=1,
        max_length=50,
    )

    sale_price: Decimal = Field(
        ...,
        ge=0,
    )

    cost_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    minimum_stock: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    maximum_stock: Decimal | None = Field(
        default=None,
        ge=0,
    )

    status: StatusValue = "active"

    @model_validator(mode="after")
    def validate_stock_limits(self):
        if (
            self.maximum_stock is not None
            and self.maximum_stock < self.minimum_stock
        ):
            raise ValueError(
                "El stock máximo no puede ser menor al stock mínimo."
            )

        return self


class ProductCreateRequest(BaseModel):
    category_id: UUID | None = None

    sku: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    unit: str = Field(
        default="unidad",
        min_length=1,
        max_length=50,
    )

    sale_price: Decimal = Field(
        ...,
        ge=0,
    )

    cost_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    initial_stock: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    minimum_stock: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    maximum_stock: Decimal | None = Field(
        default=None,
        ge=0,
    )

    status: StatusValue = "active"

    @model_validator(mode="after")
    def validate_stock_limits(self):
        if (
            self.maximum_stock is not None
            and self.maximum_stock < self.minimum_stock
        ):
            raise ValueError(
                "El stock máximo no puede ser menor al stock mínimo."
            )

        return self


class ProductResponse(BaseModel):
    id: UUID
    category_id: UUID | None
    category_name: str | None

    sku: str
    name: str
    description: str | None
    unit: str

    sale_price: Decimal
    cost_price: Decimal

    stock_quantity: Decimal
    minimum_stock: Decimal
    maximum_stock: Decimal | None

    status: str


class SaleItemCreate(BaseModel):
    product_id: UUID

    quantity: Decimal = Field(
        ...,
        gt=0,
    )

    discount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )


class SaleCreateRequest(BaseModel):
    customer_id: UUID | None = None

    items: list[SaleItemCreate] = Field(
        ...,
        min_length=1,
    )

    sale_discount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    tax_rate: Decimal = Field(
        default=Decimal("0.18"),
        ge=0,
        le=1,
    )

    payment_method: PaymentMethod

    payment_reference: str | None = Field(
        default=None,
        max_length=150,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


class SaleDetailResponse(BaseModel):
    product_id: UUID
    product_name: str

    quantity: Decimal
    unit_price: Decimal
    discount: Decimal
    subtotal: Decimal


class SaleCreatedResponse(BaseModel):
    id: UUID
    sale_number: str

    customer_id: UUID | None

    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal

    status: str
    payment_method: str

    items: list[SaleDetailResponse]


class SaleListItem(BaseModel):
    id: UUID
    sale_number: str

    customer_id: UUID | None
    customer_name: str

    sale_date: str

    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal

    status: str



class SalePaymentResponse(BaseModel):
    payment_method: str
    amount: Decimal
    payment_date: str
    reference: str | None
    status: str


class SaleViewResponse(BaseModel):
    id: UUID
    sale_number: str

    customer_id: UUID | None
    customer_name: str
    created_by_name: str

    sale_date: str

    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal

    status: str
    notes: str | None

    payment: SalePaymentResponse | None
    items: list[SaleDetailResponse]


class SaleCancelRequest(BaseModel):
    reason: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )


class InventoryItemResponse(BaseModel):
    inventory_id: UUID
    product_id: UUID

    sku: str
    product_name: str

    stock_quantity: Decimal
    minimum_stock: Decimal
    maximum_stock: Decimal | None

    stock_status: str
