from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


def list_customers(
    connection: Connection,
    company_id: UUID,
    search: str | None = None,
):
    search_value = (
        f"%{search.strip()}%"
        if search
        else None
    )

    return connection.execute(
        text("""
            SELECT
                id,
                document_type,
                document_number,
                first_name,
                last_name,
                business_name,
                email,
                phone,
                address,
                city,
                status
            FROM customers
            WHERE company_id = :company_id
                AND (
                    CAST(:search AS TEXT) IS NULL
                    OR CAST(:search AS TEXT) = ''
                    OR LOWER(COALESCE(first_name, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(last_name, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(business_name, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(document_number, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(email, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(phone, '')) LIKE LOWER(:search)
                    OR LOWER(COALESCE(city, '')) LIKE LOWER(:search)
              )
            ORDER BY
                COALESCE(
                    business_name,
                    first_name,
                    ''
                ),
                last_name
        """),
        {
            "company_id": company_id,
            "search": search_value,
        },
    ).mappings().all()


def find_customer_by_document(
    connection: Connection,
    company_id: UUID,
    document_number: str,
):
    return connection.execute(
        text("""
            SELECT id
            FROM customers
            WHERE company_id = :company_id
              AND document_number = :document_number
            LIMIT 1
        """),
        {
            "company_id": company_id,
            "document_number": document_number,
        },
    ).mappings().first()


def get_customer(
        connection: Connection,
        company_id: UUID,
        customer_id: UUID,
    ):
    return connection.execute(
    text("""
        SELECT
        id,
        document_type,
        document_number,
        first_name,
        last_name,
        business_name,
        email,
        phone,
        address,
        city,
        status
        FROM customers
        WHERE id = :customer_id
        AND company_id = :company_id
        LIMIT 1
    """),
{
"customer_id": customer_id,
"company_id": company_id,
},
).mappings().first()




def create_customer(
    connection: Connection,
    *,
    company_id: UUID,
    document_type: str,
    document_number: str,
    first_name: str | None,
    last_name: str | None,
    business_name: str | None,
    email: str | None,
    phone: str | None,
    address: str | None,
    city: str | None,
    status: str,
):
    return connection.execute(
        text("""
            INSERT INTO customers (
                company_id,
                document_type,
                document_number,
                first_name,
                last_name,
                business_name,
                email,
                phone,
                address,
                city,
                status
            )
            VALUES (
                :company_id,
                :document_type,
                :document_number,
                :first_name,
                :last_name,
                :business_name,
                :email,
                :phone,
                :address,
                :city,
                :status
            )
            RETURNING
                id,
                document_type,
                document_number,
                first_name,
                last_name,
                business_name,
                email,
                phone,
                address,
                city,
                status
        """),
        {
            "company_id": company_id,
            "document_type": document_type,
            "document_number": document_number,
            "first_name": first_name,
            "last_name": last_name,
            "business_name": business_name,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "status": status,
        },
    ).mappings().one()


def list_categories(
    connection: Connection,
    company_id: UUID,
    search: str | None = None,
):
    search_value = (
        f"%{search.strip()}%"
        if search
        else None
    )

    return connection.execute(
        text("""
            SELECT
                id,
                name,
                description,
                status
            FROM categories
            WHERE company_id = :company_id
              AND (
                    CAST(:search AS TEXT) IS NULL
                    OR CAST(:search AS TEXT) = ''
                    OR LOWER(COALESCE(name, '')) LIKE LOWER(:search)
              )
            ORDER BY name
        """),
        {
            "company_id": company_id,
            "search": search_value,
        },
    ).mappings().all()


def find_category_by_name(
    connection: Connection,
    company_id: UUID,
    name: str,
):
    return connection.execute(
        text("""
            SELECT id
            FROM categories
            WHERE company_id = :company_id
              AND LOWER(name) = LOWER(:name)
            LIMIT 1
        """),
        {
            "company_id": company_id,
            "name": name,
        },
    ).mappings().first()


def get_category(
    connection: Connection,
    company_id: UUID,
    category_id: UUID,
):
    return connection.execute(
        text("""
            SELECT id
            FROM categories
            WHERE company_id = :company_id
              AND id = :category_id
            LIMIT 1
        """),
        {
            "company_id": company_id,
            "category_id": category_id,
        },
    ).mappings().first()


def create_category(
    connection: Connection,
    *,
    company_id: UUID,
    name: str,
    description: str | None,
    status: str,
):
    return connection.execute(
        text("""
            INSERT INTO categories (
                company_id,
                name,
                description,
                status
            )
            VALUES (
                :company_id,
                :name,
                :description,
                :status
            )
            RETURNING
                id,
                name,
                description,
                status
        """),
        {
            "company_id": company_id,
            "name": name,
            "description": description,
            "status": status,
        },
    ).mappings().one()


def list_products(
    connection: Connection,
    company_id: UUID,
    search: str | None = None,
    category_id: UUID | None = None,
):
    search_value = (
        f"%{search.strip()}%"
        if search
        else None
    )

    return connection.execute(
        text("""
            SELECT
                p.id,
                p.category_id,
                c.name AS category_name,
                p.sku,
                p.name,
                p.description,
                p.unit,
                p.sale_price,
                p.cost_price,
                p.status,
                COALESCE(i.stock_quantity, 0) AS stock_quantity,
                COALESCE(i.minimum_stock, 0) AS minimum_stock,
                i.maximum_stock
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            LEFT JOIN inventory i
                ON i.product_id = p.id
               AND i.company_id = p.company_id
            WHERE p.company_id = :company_id
              AND (
                    CAST(:search AS TEXT) IS NULL
                    OR CAST(:search AS TEXT) = ''
                    OR LOWER(COALESCE(p.name, '')) LIKE LOWER(:search)
              )
              AND (
                    CAST(:category_id AS UUID) IS NULL
                    OR p.category_id = CAST(:category_id AS UUID)
              )
            ORDER BY p.name
        """),
        {
            "company_id": company_id,
            "search": search_value,
            "category_id": category_id,
        },
    ).mappings().all()


def find_product_by_sku(
    connection: Connection,
    company_id: UUID,
    sku: str,
):
    return connection.execute(
        text("""
            SELECT id
            FROM products
            WHERE company_id = :company_id
              AND LOWER(sku) = LOWER(:sku)
            LIMIT 1
        """),
        {
            "company_id": company_id,
            "sku": sku,
        },
    ).mappings().first()


def create_product(
    connection: Connection,
    *,
    company_id: UUID,
    category_id: UUID | None,
    sku: str,
    name: str,
    description: str | None,
    unit: str,
    sale_price,
    cost_price,
    status: str,
):
    return connection.execute(
        text("""
            INSERT INTO products (
                company_id,
                category_id,
                sku,
                name,
                description,
                unit,
                sale_price,
                cost_price,
                status
            )
            VALUES (
                :company_id,
                :category_id,
                :sku,
                :name,
                :description,
                :unit,
                :sale_price,
                :cost_price,
                :status
            )
            RETURNING
                id,
                category_id,
                sku,
                name,
                description,
                unit,
                sale_price,
                cost_price,
                status
        """),
        {
            "company_id": company_id,
            "category_id": category_id,
            "sku": sku,
            "name": name,
            "description": description,
            "unit": unit,
            "sale_price": sale_price,
            "cost_price": cost_price,
            "status": status,
        },
    ).mappings().one()


def create_inventory(
    connection: Connection,
    *,
    company_id: UUID,
    product_id: UUID,
    stock_quantity,
    minimum_stock,
    maximum_stock,
):
    return connection.execute(
        text("""
            INSERT INTO inventory (
                company_id,
                product_id,
                stock_quantity,
                minimum_stock,
                maximum_stock,
                updated_at
            )
            VALUES (
                :company_id,
                :product_id,
                :stock_quantity,
                :minimum_stock,
                :maximum_stock,
                NOW()
            )
            RETURNING
                id,
                stock_quantity,
                minimum_stock,
                maximum_stock
        """),
        {
            "company_id": company_id,
            "product_id": product_id,
            "stock_quantity": stock_quantity,
            "minimum_stock": minimum_stock,
            "maximum_stock": maximum_stock,
        },
    ).mappings().one()


def list_inventory(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                i.id AS inventory_id,
                p.id AS product_id,
                p.sku,
                p.name AS product_name,
                i.stock_quantity,
                i.minimum_stock,
                i.maximum_stock,
                CASE
                    WHEN i.stock_quantity <= 0
                        THEN 'Sin stock'
                    WHEN i.stock_quantity <= i.minimum_stock
                        THEN 'Bajo'
                    ELSE 'Disponible'
                END AS stock_status
            FROM inventory i
            INNER JOIN products p
                ON p.id = i.product_id
            WHERE i.company_id = :company_id
            ORDER BY p.name
        """),
        {
            "company_id": company_id,
        },
    ).mappings().all()


def get_product_inventory_for_sale(
    connection: Connection,
    company_id: UUID,
    product_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                p.sale_price,
                p.status AS product_status,
                i.id AS inventory_id,
                i.stock_quantity,
                i.minimum_stock
            FROM products p
            INNER JOIN inventory i
                ON i.product_id = p.id
               AND i.company_id = p.company_id
            WHERE p.id = :product_id
              AND p.company_id = :company_id
            FOR UPDATE OF i
        """),
        {
            "product_id": product_id,
            "company_id": company_id,
        },
    ).mappings().first()


def insert_sale(
    connection: Connection,
    *,
    company_id: UUID,
    customer_id: UUID | None,
    created_by: UUID,
    sale_number: str,
    subtotal,
    discount,
    tax,
    total,
    status: str,
    notes: str | None,
):
    return connection.execute(
        text("""
            INSERT INTO sales (
                company_id,
                customer_id,
                created_by,
                sale_number,
                sale_date,
                subtotal,
                discount,
                tax,
                total,
                status,
                notes
            )
            VALUES (
                :company_id,
                :customer_id,
                :created_by,
                :sale_number,
                NOW(),
                :subtotal,
                :discount,
                :tax,
                :total,
                :status,
                :notes
            )
            RETURNING
                id,
                sale_number
        """),
        {
            "company_id": company_id,
            "customer_id": customer_id,
            "created_by": created_by,
            "sale_number": sale_number,
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "total": total,
            "status": status,
            "notes": notes,
        },
    ).mappings().one()


def insert_sale_detail(
    connection: Connection,
    *,
    sale_id: UUID,
    product_id: UUID,
    quantity,
    unit_price,
    discount,
    subtotal,
):
    connection.execute(
        text("""
            INSERT INTO sale_details (
                sale_id,
                product_id,
                quantity,
                unit_price,
                discount,
                subtotal
            )
            VALUES (
                :sale_id,
                :product_id,
                :quantity,
                :unit_price,
                :discount,
                :subtotal
            )
        """),
        {
            "sale_id": sale_id,
            "product_id": product_id,
            "quantity": quantity,
            "unit_price": unit_price,
            "discount": discount,
            "subtotal": subtotal,
        },
    )


def decrease_inventory(
    connection: Connection,
    *,
    inventory_id: UUID,
    quantity,
):
    connection.execute(
        text("""
            UPDATE inventory
            SET
                stock_quantity = stock_quantity - :quantity,
                updated_at = NOW()
            WHERE id = :inventory_id
        """),
        {
            "inventory_id": inventory_id,
            "quantity": quantity,
        },
    )


def insert_inventory_movement(
    connection: Connection,
    *,
    company_id: UUID,
    inventory_id: UUID,
    product_id: UUID,
    user_id: UUID,
    quantity,
    sale_id: UUID,
):
    connection.execute(
        text("""
            INSERT INTO inventory_movements (
                company_id,
                inventory_id,
                product_id,
                user_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                reason,
                movement_date
            )
            VALUES (
                :company_id,
                :inventory_id,
                :product_id,
                :user_id,
                'exit',
                :quantity,
                'sale',
                :sale_id,
                'Salida automática por venta',
                NOW()
            )
        """),
        {
            "company_id": company_id,
            "inventory_id": inventory_id,
            "product_id": product_id,
            "user_id": user_id,
            "quantity": quantity,
            "sale_id": sale_id,
        },
    )


def insert_payment(
    connection: Connection,
    *,
    sale_id: UUID,
    payment_method: str,
    amount,
    reference: str | None,
):
    connection.execute(
        text("""
            INSERT INTO payments (
                sale_id,
                payment_method,
                amount,
                payment_date,
                reference,
                status
            )
            VALUES (
                :sale_id,
                :payment_method,
                :amount,
                NOW(),
                :reference,
                'completed'
            )
        """),
        {
            "sale_id": sale_id,
            "payment_method": payment_method,
            "amount": amount,
            "reference": reference,
        },
    )


def list_sales(
    connection: Connection,
    company_id: UUID,
    created_by: UUID | None = None,
):
    filters = """
        WHERE s.company_id = :company_id
    """

    params = {
        "company_id": company_id,
    }

    if created_by is not None:
        filters += """
            AND s.created_by = :created_by
        """

        params["created_by"] = created_by

    return connection.execute(
        text(f"""
            SELECT
                s.id,
                s.sale_number,
                s.customer_id,
                COALESCE(
                    NULLIF(c.business_name, ''),
                    NULLIF(
                        CONCAT_WS(
                            ' ',
                            c.first_name,
                            c.last_name
                        ),
                        ''
                    ),
                    'Cliente no especificado'
                ) AS customer_name,
                s.sale_date,
                s.subtotal,
                s.discount,
                s.tax,
                s.total,
                s.status
            FROM sales s
            LEFT JOIN customers c
                ON c.id = s.customer_id
            {filters}
            ORDER BY s.sale_date DESC
            LIMIT 200
        """),
        params,
    ).mappings().all()


def update_customer(
    connection: Connection,
    company_id: UUID,
    customer_id: UUID,
    **values,
):
    return connection.execute(
        text("""
            UPDATE customers
            SET
                document_type = :document_type,
                document_number = :document_number,
                first_name = :first_name,
                last_name = :last_name,
                business_name = :business_name,
                email = :email,
                phone = :phone,
                address = :address,
                city = :city,
                status = :status,
                updated_at = NOW()
            WHERE id = :customer_id
              AND company_id = :company_id
            RETURNING
                id,
                document_type,
                document_number,
                first_name,
                last_name,
                business_name,
                email,
                phone,
                address,
                city,
                status
        """),
        {
            **values,
            "customer_id": customer_id,
            "company_id": company_id,
        },
    ).mappings().first()


def list_customer_history(
    connection: Connection,
    company_id: UUID,
    customer_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                s.id AS id,
                s.sale_number,
                s.sale_date,
                s.subtotal,
                s.discount,
                s.tax,
                s.total,
                s.status
            FROM sales s
            WHERE s.company_id = :company_id
              AND s.customer_id = :customer_id
            ORDER BY s.sale_date DESC
            LIMIT 200
        """),
        {
            "company_id": company_id,
            "customer_id": customer_id,
        },
    ).mappings().all()


def get_category(
    connection: Connection,
    company_id: UUID,
    category_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                id,
                name,
                description,
                status
            FROM categories
            WHERE id = :category_id
              AND company_id = :company_id
        """),
        {
            "category_id": category_id,
            "company_id": company_id,
        },
    ).mappings().first()


def update_category(
    connection: Connection,
    company_id: UUID,
    category_id: UUID,
    **values,
):
    return connection.execute(
        text("""
            UPDATE categories
            SET
                name = :name,
                description = :description,
                status = :status,
                updated_at = NOW()
            WHERE id = :category_id
              AND company_id = :company_id
            RETURNING
                id,
                name,
                description,
                status
        """),
        {
            **values,
            "category_id": category_id,
            "company_id": company_id,
        },
    ).mappings().first()


def get_product(
    connection: Connection,
    company_id: UUID,
    product_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                p.id,
                p.category_id,
                c.name AS category_name,
                p.sku,
                p.name,
                p.description,
                p.unit,
                p.sale_price,
                p.cost_price,
                p.status,
                i.stock_quantity,
                i.minimum_stock,
                i.maximum_stock
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
               AND c.company_id = p.company_id
            LEFT JOIN inventory i
                ON i.product_id = p.id
               AND i.company_id = p.company_id
            WHERE p.id = :product_id
              AND p.company_id = :company_id
        """),
        {
            "product_id": product_id,
            "company_id": company_id,
        },
    ).mappings().first()


def update_product(
    connection: Connection,
    company_id: UUID,
    product_id: UUID,
    **values,
):
    return connection.execute(
        text("""
            UPDATE products
            SET
                category_id = :category_id,
                sku = :sku,
                name = :name,
                description = :description,
                unit = :unit,
                sale_price = :sale_price,
                cost_price = :cost_price,
                status = :status,
                updated_at = NOW()
            WHERE id = :product_id
              AND company_id = :company_id
            RETURNING id
        """),
        {
            **values,
            "product_id": product_id,
            "company_id": company_id,
        },
    ).mappings().first()


def update_inventory_limits(
    connection: Connection,
    company_id: UUID,
    product_id: UUID,
    minimum_stock,
    maximum_stock,
):
    return connection.execute(
        text("""
            UPDATE inventory
            SET
                minimum_stock = :minimum_stock,
                maximum_stock = :maximum_stock,
                updated_at = NOW()
            WHERE product_id = :product_id
              AND company_id = :company_id
            RETURNING
                stock_quantity,
                minimum_stock,
                maximum_stock
        """),
        {
            "product_id": product_id,
            "company_id": company_id,
            "minimum_stock": minimum_stock,
            "maximum_stock": maximum_stock,
        },
    ).mappings().first()