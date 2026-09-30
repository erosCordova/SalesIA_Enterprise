from decimal import (
    Decimal,
    ROUND_HALF_UP,
)
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.core.database import engine
from app.repositories import commercial as repository
from app.schemas.commercial import (
    CategoryCreateRequest,
    CategoryResponse,
    CustomerCreateRequest,
    CustomerResponse,
    InventoryItemResponse,
    ProductCreateRequest,
    ProductResponse,
    SaleCreateRequest,
    SaleCreatedResponse,
    SaleDetailResponse,
    SaleListItem,
)


MONEY = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(
        MONEY,
        rounding=ROUND_HALF_UP,
    )


def clean_optional(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    value = value.strip()

    return value or None


def get_customers(
    current_user: dict,
) -> list[CustomerResponse]:
    with engine.connect() as connection:
        rows = repository.list_customers(
            connection,
            current_user["company_id"],
        )

    return [
        CustomerResponse(**dict(row))
        for row in rows
    ]


def create_customer(
    data: CustomerCreateRequest,
    current_user: dict,
) -> CustomerResponse:
    company_id = current_user["company_id"]

    document_number = (
        data.document_number.strip()
    )

    with engine.begin() as connection:
        existing = repository.find_customer_by_document(
            connection,
            company_id,
            document_number,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe un cliente con ese documento."
                ),
            )

        row = repository.create_customer(
            connection,
            company_id=company_id,
            document_type=data.document_type.strip(),
            document_number=document_number,
            first_name=clean_optional(data.first_name),
            last_name=clean_optional(data.last_name),
            business_name=clean_optional(
                data.business_name
            ),
            email=clean_optional(data.email),
            phone=clean_optional(data.phone),
            address=clean_optional(data.address),
            city=clean_optional(data.city),
            status=data.status,
        )

    return CustomerResponse(**dict(row))


def get_categories(
    current_user: dict,
) -> list[CategoryResponse]:
    with engine.connect() as connection:
        rows = repository.list_categories(
            connection,
            current_user["company_id"],
        )

    return [
        CategoryResponse(**dict(row))
        for row in rows
    ]


def create_category(
    data: CategoryCreateRequest,
    current_user: dict,
) -> CategoryResponse:
    company_id = current_user["company_id"]
    name = data.name.strip()

    with engine.begin() as connection:
        existing = repository.find_category_by_name(
            connection,
            company_id,
            name,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe una categoría con ese nombre."
                ),
            )

        row = repository.create_category(
            connection,
            company_id=company_id,
            name=name,
            description=clean_optional(
                data.description
            ),
            status=data.status,
        )

    return CategoryResponse(**dict(row))


def get_products(
    current_user: dict,
) -> list[ProductResponse]:
    with engine.connect() as connection:
        rows = repository.list_products(
            connection,
            current_user["company_id"],
        )

    return [
        ProductResponse(**dict(row))
        for row in rows
    ]


def create_product(
    data: ProductCreateRequest,
    current_user: dict,
) -> ProductResponse:
    company_id = current_user["company_id"]
    sku = data.sku.strip()
    name = data.name.strip()

    with engine.begin() as connection:
        existing = repository.find_product_by_sku(
            connection,
            company_id,
            sku,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe un producto con ese SKU."
                ),
            )

        if data.category_id is not None:
            category = repository.get_category(
                connection,
                company_id,
                data.category_id,
            )

            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "La categoría seleccionada no existe."
                    ),
                )

        product = repository.create_product(
            connection,
            company_id=company_id,
            category_id=data.category_id,
            sku=sku,
            name=name,
            description=clean_optional(
                data.description
            ),
            unit=data.unit.strip(),
            sale_price=money(data.sale_price),
            cost_price=money(data.cost_price),
            status=data.status,
        )

        inventory = repository.create_inventory(
            connection,
            company_id=company_id,
            product_id=product["id"],
            stock_quantity=data.initial_stock,
            minimum_stock=data.minimum_stock,
            maximum_stock=data.maximum_stock,
        )

        category_name = None

        if data.category_id is not None:
            categories = repository.list_categories(
                connection,
                company_id,
            )

            for category in categories:
                if (
                    category["id"]
                    == data.category_id
                ):
                    category_name = category["name"]
                    break

    return ProductResponse(
        id=product["id"],
        category_id=product["category_id"],
        category_name=category_name,
        sku=product["sku"],
        name=product["name"],
        description=product["description"],
        unit=product["unit"],
        sale_price=product["sale_price"],
        cost_price=product["cost_price"],
        stock_quantity=inventory[
            "stock_quantity"
        ],
        minimum_stock=inventory[
            "minimum_stock"
        ],
        maximum_stock=inventory[
            "maximum_stock"
        ],
        status=product["status"],
    )


def get_inventory(
    current_user: dict,
) -> list[InventoryItemResponse]:
    with engine.connect() as connection:
        rows = repository.list_inventory(
            connection,
            current_user["company_id"],
        )

    return [
        InventoryItemResponse(**dict(row))
        for row in rows
    ]


def get_sales(
    current_user: dict,
) -> list[SaleListItem]:
    created_by = None

    if current_user["role"] == "Vendedor":
        created_by = current_user["id"]

    with engine.connect() as connection:
        rows = repository.list_sales(
            connection,
            current_user["company_id"],
            created_by=created_by,
        )

    return [
        SaleListItem(
            id=row["id"],
            sale_number=row["sale_number"],
            customer_id=row["customer_id"],
            customer_name=row["customer_name"],
            sale_date=row[
                "sale_date"
            ].isoformat(),
            subtotal=row["subtotal"],
            discount=row["discount"],
            tax=row["tax"],
            total=row["total"],
            status=row["status"],
        )
        for row in rows
    ]


def create_sale(
    data: SaleCreateRequest,
    current_user: dict,
) -> SaleCreatedResponse:
    company_id = current_user["company_id"]
    user_id = current_user["id"]

    product_ids = [
        item.product_id
        for item in data.items
    ]

    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No repitas el mismo producto en la venta."
            ),
        )

    with engine.begin() as connection:
        if data.customer_id is not None:
            customer = repository.get_customer(
                connection,
                company_id,
                data.customer_id,
            )

            if not customer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "El cliente seleccionado no existe."
                    ),
                )

        details: list[dict] = []
        subtotal = Decimal("0")

        for item in data.items:
            product = (
                repository
                .get_product_inventory_for_sale(
                    connection,
                    company_id,
                    item.product_id,
                )
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"El producto {item.product_id} "
                        "no existe o no tiene inventario."
                    ),
                )

            if product["product_status"] != "active":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"El producto "
                        f"{product['product_name']} "
                        "se encuentra inactivo."
                    ),
                )

            if (
                product["stock_quantity"]
                < item.quantity
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Stock insuficiente para "
                        f"{product['product_name']}."
                    ),
                )

            unit_price = money(
                product["sale_price"]
            )

            gross = money(
                unit_price * item.quantity
            )

            line_discount = money(
                item.discount
            )

            if line_discount > gross:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "El descuento de una línea "
                        "no puede superar su importe."
                    ),
                )

            line_subtotal = money(
                gross - line_discount
            )

            subtotal += line_subtotal

            details.append(
                {
                    "product_id": product[
                        "product_id"
                    ],
                    "product_name": product[
                        "product_name"
                    ],
                    "inventory_id": product[
                        "inventory_id"
                    ],
                    "quantity": item.quantity,
                    "unit_price": unit_price,
                    "discount": line_discount,
                    "subtotal": line_subtotal,
                }
            )

        subtotal = money(subtotal)
        sale_discount = money(
            data.sale_discount
        )

        if sale_discount > subtotal:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "El descuento general no puede "
                    "superar el subtotal."
                ),
            )

        taxable_amount = money(
            subtotal - sale_discount
        )

        tax = money(
            taxable_amount
            * data.tax_rate
        )

        total = money(
            taxable_amount + tax
        )

        sale_number = (
            "VTA-"
            + uuid4().hex[:10].upper()
        )

        sale = repository.insert_sale(
            connection,
            company_id=company_id,
            customer_id=data.customer_id,
            created_by=user_id,
            sale_number=sale_number,
            subtotal=subtotal,
            discount=sale_discount,
            tax=tax,
            total=total,
            status="completed",
            notes=clean_optional(
                data.notes
            ),
        )

        response_details = []

        for detail in details:
            repository.insert_sale_detail(
                connection,
                sale_id=sale["id"],
                product_id=detail["product_id"],
                quantity=detail["quantity"],
                unit_price=detail["unit_price"],
                discount=detail["discount"],
                subtotal=detail["subtotal"],
            )

            repository.decrease_inventory(
                connection,
                inventory_id=detail[
                    "inventory_id"
                ],
                quantity=detail["quantity"],
            )

            repository.insert_inventory_movement(
                connection,
                company_id=company_id,
                inventory_id=detail[
                    "inventory_id"
                ],
                product_id=detail[
                    "product_id"
                ],
                user_id=user_id,
                quantity=detail["quantity"],
                sale_id=sale["id"],
            )

            response_details.append(
                SaleDetailResponse(
                    product_id=detail[
                        "product_id"
                    ],
                    product_name=detail[
                        "product_name"
                    ],
                    quantity=detail[
                        "quantity"
                    ],
                    unit_price=detail[
                        "unit_price"
                    ],
                    discount=detail[
                        "discount"
                    ],
                    subtotal=detail[
                        "subtotal"
                    ],
                )
            )

        repository.insert_payment(
            connection,
            sale_id=sale["id"],
            payment_method=(
                data.payment_method.strip()
            ),
            amount=total,
            reference=clean_optional(
                data.payment_reference
            ),
        )

    return SaleCreatedResponse(
        id=sale["id"],
        sale_number=sale["sale_number"],
        customer_id=data.customer_id,
        subtotal=subtotal,
        discount=sale_discount,
        tax=tax,
        total=total,
        status="completed",
        payment_method=(
            data.payment_method.strip()
        ),
        items=response_details,
    )
