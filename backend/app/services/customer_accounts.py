from uuid import UUID

from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy import text

from supabase import create_client

from app.core.config import settings
from app.core.database import engine

from app.schemas.customer_accounts import (
    ClientPortalResponse,
    ClientSaleItem,
    CustomerAccountCreateRequest,
    CustomerAccountResponse,
    CustomerAccountUpdateRequest,
)


def clean(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    value = value.strip()

    return value or None


def internal_email(
    dni: str,
) -> str:
    return (
        f"{dni}@salesia.local"
    )


def admin_client():
    if not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=
                "SUPABASE_URL no está configurado.",
        )

    if not settings.SUPABASE_SECRET_KEY:
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=
                "SUPABASE_SECRET_KEY no está configurado.",
        )

    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )


def customer_account_row(
    connection,
    *,
    company_id,
    customer_id,
):
    return connection.execute(
        text("""
            SELECT
                c.id,
                c.document_type,
                c.document_number,
                c.first_name,
                c.last_name,
                c.business_name,
                c.email,
                c.phone,
                c.address,
                c.city,
                c.status,

                u.id AS user_id,
                u.auth_user_id,
                u.dni AS access_dni,
                u.status AS access_status

            FROM customers c

            LEFT JOIN users u
                ON u.customer_id = c.id

            LEFT JOIN roles r
                ON r.id = u.role_id

            WHERE
                c.id = :customer_id
                AND c.company_id = :company_id
                AND (
                    r.name = 'Cliente'
                    OR r.name IS NULL
                )

            LIMIT 1
        """),
        {
            "company_id":
                company_id,

            "customer_id":
                customer_id,
        },
    ).mappings().first()


def response_from_row(
    row,
) -> CustomerAccountResponse:
    values = dict(
        row,
    )

    return CustomerAccountResponse(
        id=values["id"],

        document_type=
            values["document_type"],

        document_number=
            values["document_number"],

        first_name=
            values["first_name"],

        last_name=
            values["last_name"],

        business_name=
            values["business_name"],

        email=
            values["email"],

        phone=
            values["phone"],

        address=
            values["address"],

        city=
            values["city"],

        status=
            values["status"],

        access_dni=
            values.get(
                "access_dni",
            ),

        access_enabled=(
            values.get(
                "access_status",
            )
            == "active"
            and values[
                "status"
            ]
            == "active"
        ),
    )


def list_customer_accounts(
    current_user: dict,
) -> list[
    CustomerAccountResponse
]:
    company_id = (
        current_user[
            "company_id"
        ]
    )

    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT
                    c.id,
                    c.document_type,
                    c.document_number,
                    c.first_name,
                    c.last_name,
                    c.business_name,
                    c.email,
                    c.phone,
                    c.address,
                    c.city,
                    c.status,

                    u.dni AS access_dni,
                    u.status AS access_status

                FROM customers c

                LEFT JOIN users u
                    ON u.customer_id = c.id

                LEFT JOIN roles r
                    ON r.id = u.role_id
                    AND r.name = 'Cliente'

                WHERE
                    c.company_id = :company_id

                ORDER BY
                    COALESCE(
                        c.business_name,
                        c.first_name,
                        ''
                    ),
                    c.last_name
            """),
            {
                "company_id":
                    company_id,
            },
        ).mappings().all()

    return [
        response_from_row(
            row,
        )
        for row in rows
    ]


def create_customer_account(
    data: CustomerAccountCreateRequest,
    current_user: dict,
) -> CustomerAccountResponse:
    company_id = (
        current_user[
            "company_id"
        ]
    )

    auth_user_id = None

    first_name = (
        clean(
            data.first_name
        )
        or clean(
            data.business_name
        )
        or "Cliente"
    )

    last_name = (
        clean(
            data.last_name
        )
        or "-"
    )

    auth_email = (
        internal_email(
            data.access_dni,
        )
    )

    try:
        with engine.begin() as connection:
            duplicate_document = (
                connection.execute(
                    text("""
                        SELECT id
                        FROM customers
                        WHERE
                            company_id = :company_id
                            AND document_number = :document_number
                        LIMIT 1
                    """),
                    {
                        "company_id":
                            company_id,

                        "document_number":
                            data.document_number.strip(),
                    },
                ).mappings().first()
            )

            if duplicate_document:
                raise HTTPException(
                    status_code=
                        status.HTTP_409_CONFLICT,
                    detail=
                        "Ya existe un cliente con ese documento.",
                )

            duplicate_dni = (
                connection.execute(
                    text("""
                        SELECT id
                        FROM users
                        WHERE dni = :dni
                        LIMIT 1
                    """),
                    {
                        "dni":
                            data.access_dni,
                    },
                ).mappings().first()
            )

            if duplicate_dni:
                raise HTTPException(
                    status_code=
                        status.HTTP_409_CONFLICT,
                    detail=
                        "Ese DNI ya está registrado como usuario.",
                )

            role = connection.execute(
                text("""
                    SELECT id
                    FROM roles
                    WHERE name = 'Cliente'
                    LIMIT 1
                """)
            ).mappings().first()

            if not role:
                raise HTTPException(
                    status_code=
                        status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=
                        "El rol Cliente no está configurado.",
                )

            customer = connection.execute(
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
                    RETURNING id
                """),
                {
                    "company_id":
                        company_id,

                    "document_type":
                        data.document_type.strip(),

                    "document_number":
                        data.document_number.strip(),

                    "first_name":
                        clean(
                            data.first_name
                        ),

                    "last_name":
                        clean(
                            data.last_name
                        ),

                    "business_name":
                        clean(
                            data.business_name
                        ),

                    "email":
                        clean(
                            data.email
                        ),

                    "phone":
                        clean(
                            data.phone
                        ),

                    "address":
                        clean(
                            data.address
                        ),

                    "city":
                        clean(
                            data.city
                        ),

                    "status":
                        data.status,
                },
            ).mappings().one()

            try:
                supabase = (
                    admin_client()
                )

                auth_response = (
                    supabase
                    .auth
                    .admin
                    .create_user(
                        {
                            "email":
                                auth_email,

                            "password":
                                data.password,

                            "email_confirm":
                                True,

                            "user_metadata":
                                {
                                    "dni":
                                        data.access_dni,

                                    "role":
                                        "Cliente",
                                },
                        }
                    )
                )

                if not auth_response.user:
                    raise RuntimeError(
                        "Supabase no devolvió el usuario."
                    )

                auth_user_id = str(
                    auth_response.user.id
                )

            except HTTPException:
                raise

            except Exception as exc:
                raise HTTPException(
                    status_code=
                        status.HTTP_409_CONFLICT,
                    detail=(
                        "No se pudo crear la cuenta de acceso. "
                        "Verifica el DNI y la contraseña."
                    ),
                ) from exc

            connection.execute(
                text("""
                    INSERT INTO users (
                        auth_user_id,
                        company_id,
                        role_id,
                        customer_id,
                        dni,
                        first_name,
                        last_name,
                        email,
                        phone,
                        status
                    )
                    VALUES (
                        :auth_user_id,
                        :company_id,
                        :role_id,
                        :customer_id,
                        :dni,
                        :first_name,
                        :last_name,
                        :email,
                        :phone,
                        :status
                    )
                """),
                {
                    "auth_user_id":
                        auth_user_id,

                    "company_id":
                        company_id,

                    "role_id":
                        role["id"],

                    "customer_id":
                        customer["id"],

                    "dni":
                        data.access_dni,

                    "first_name":
                        first_name,

                    "last_name":
                        last_name,

                    "email":
                        auth_email,

                    "phone":
                        clean(
                            data.phone
                        ),

                    "status":
                        data.status,
                },
            )

            row = customer_account_row(
                connection,
                company_id=
                    company_id,
                customer_id=
                    customer["id"],
            )

        return response_from_row(
            row,
        )

    except HTTPException:
        if auth_user_id:
            try:
                (
                    admin_client()
                    .auth
                    .admin
                    .delete_user(
                        auth_user_id
                    )
                )
            except Exception:
                pass

        raise

    except Exception as exc:
        if auth_user_id:
            try:
                (
                    admin_client()
                    .auth
                    .admin
                    .delete_user(
                        auth_user_id
                    )
                )
            except Exception:
                pass

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=
                "No se pudo registrar el cliente y su cuenta.",
        ) from exc


def update_customer_account(
    customer_id: UUID,
    data: CustomerAccountUpdateRequest,
    current_user: dict,
) -> CustomerAccountResponse:
    company_id = (
        current_user[
            "company_id"
        ]
    )

    with engine.connect() as connection:
        current = customer_account_row(
            connection,
            company_id=
                company_id,
            customer_id=
                customer_id,
        )

        if not current:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=
                    "Cliente no encontrado.",
            )

        duplicate_document = (
            connection.execute(
                text("""
                    SELECT id
                    FROM customers
                    WHERE
                        company_id = :company_id
                        AND document_number = :document_number
                        AND id <> :customer_id
                    LIMIT 1
                """),
                {
                    "company_id":
                        company_id,

                    "document_number":
                        data.document_number.strip(),

                    "customer_id":
                        customer_id,
                },
            ).mappings().first()
        )

        if duplicate_document:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=
                    "Ya existe otro cliente con ese documento.",
            )

        duplicate_dni = connection.execute(
            text("""
                SELECT id
                FROM users
                WHERE
                    dni = :dni
                    AND (
                        customer_id IS NULL
                        OR customer_id <> :customer_id
                    )
                LIMIT 1
            """),
            {
                "dni":
                    data.access_dni,

                "customer_id":
                    customer_id,
            },
        ).mappings().first()

        if duplicate_dni:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=
                    "Ese DNI ya está registrado como usuario.",
            )

    auth_user_id = (
        str(
            current[
                "auth_user_id"
            ]
        )
        if current[
            "auth_user_id"
        ]
        else None
    )

    auth_email = (
        internal_email(
            data.access_dni,
        )
    )

    first_name = (
        clean(
            data.first_name
        )
        or clean(
            data.business_name
        )
        or "Cliente"
    )

    last_name = (
        clean(
            data.last_name
        )
        or "-"
    )

    if auth_user_id:
        attributes = {}

        if (
            data.access_dni
            != current[
                "access_dni"
            ]
        ):
            attributes[
                "email"
            ] = auth_email

        if data.new_password:
            attributes[
                "password"
            ] = (
                data.new_password
            )

        attributes[
            "user_metadata"
        ] = {
            "dni":
                data.access_dni,

            "role":
                "Cliente",
        }

        try:
            (
                admin_client()
                .auth
                .admin
                .update_user_by_id(
                    auth_user_id,
                    attributes,
                )
            )

        except Exception as exc:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=(
                    "No se pudo actualizar la cuenta de acceso."
                ),
            ) from exc

    else:
        if not data.new_password:
            raise HTTPException(
                status_code=
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Este cliente todavía no tiene acceso. "
                    "Ingresa una contraseña para crear su cuenta."
                ),
            )

        try:
            auth_response = (
                admin_client()
                .auth
                .admin
                .create_user(
                    {
                        "email":
                            auth_email,

                        "password":
                            data.new_password,

                        "email_confirm":
                            True,

                        "user_metadata":
                            {
                                "dni":
                                    data.access_dni,

                                "role":
                                    "Cliente",
                            },
                    }
                )
            )

            if not auth_response.user:
                raise RuntimeError(
                    "Supabase no devolvió el usuario."
                )

            auth_user_id = str(
                auth_response.user.id
            )

        except Exception as exc:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=
                    "No se pudo crear la cuenta de acceso.",
            ) from exc

    try:
        with engine.begin() as connection:
            role = connection.execute(
                text("""
                    SELECT id
                    FROM roles
                    WHERE name = 'Cliente'
                    LIMIT 1
                """)
            ).mappings().first()

            if not role:
                raise HTTPException(
                    status_code=
                        status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=
                        "El rol Cliente no está configurado.",
                )

            connection.execute(
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
                    WHERE
                        id = :customer_id
                        AND company_id = :company_id
                """),
                {
                    "document_type":
                        data.document_type.strip(),

                    "document_number":
                        data.document_number.strip(),

                    "first_name":
                        clean(
                            data.first_name
                        ),

                    "last_name":
                        clean(
                            data.last_name
                        ),

                    "business_name":
                        clean(
                            data.business_name
                        ),

                    "email":
                        clean(
                            data.email
                        ),

                    "phone":
                        clean(
                            data.phone
                        ),

                    "address":
                        clean(
                            data.address
                        ),

                    "city":
                        clean(
                            data.city
                        ),

                    "status":
                        data.status,

                    "customer_id":
                        customer_id,

                    "company_id":
                        company_id,
                },
            )

            existing_user = (
                connection.execute(
                    text("""
                        SELECT id
                        FROM users
                        WHERE customer_id = :customer_id
                        LIMIT 1
                    """),
                    {
                        "customer_id":
                            customer_id,
                    },
                ).mappings().first()
            )

            if existing_user:
                connection.execute(
                    text("""
                        UPDATE users
                        SET
                            auth_user_id = :auth_user_id,
                            role_id = :role_id,
                            dni = :dni,
                            first_name = :first_name,
                            last_name = :last_name,
                            email = :email,
                            phone = :phone,
                            status = :status,
                            updated_at = NOW()
                        WHERE
                            id = :user_id
                    """),
                    {
                        "auth_user_id":
                            auth_user_id,

                        "role_id":
                            role["id"],

                        "dni":
                            data.access_dni,

                        "first_name":
                            first_name,

                        "last_name":
                            last_name,

                        "email":
                            auth_email,

                        "phone":
                            clean(
                                data.phone
                            ),

                        "status":
                            data.status,

                        "user_id":
                            existing_user[
                                "id"
                            ],
                    },
                )

            else:
                connection.execute(
                    text("""
                        INSERT INTO users (
                            auth_user_id,
                            company_id,
                            role_id,
                            customer_id,
                            dni,
                            first_name,
                            last_name,
                            email,
                            phone,
                            status
                        )
                        VALUES (
                            :auth_user_id,
                            :company_id,
                            :role_id,
                            :customer_id,
                            :dni,
                            :first_name,
                            :last_name,
                            :email,
                            :phone,
                            :status
                        )
                    """),
                    {
                        "auth_user_id":
                            auth_user_id,

                        "company_id":
                            company_id,

                        "role_id":
                            role["id"],

                        "customer_id":
                            customer_id,

                        "dni":
                            data.access_dni,

                        "first_name":
                            first_name,

                        "last_name":
                            last_name,

                        "email":
                            auth_email,

                        "phone":
                            clean(
                                data.phone
                            ),

                        "status":
                            data.status,
                    },
                )

            row = customer_account_row(
                connection,
                company_id=
                    company_id,
                customer_id=
                    customer_id,
            )

        return response_from_row(
            row,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=
                "No se pudo actualizar el cliente.",
        ) from exc


def deactivate_customer_account(
    customer_id: UUID,
    current_user: dict,
):
    company_id = (
        current_user[
            "company_id"
        ]
    )

    with engine.begin() as connection:
        customer = connection.execute(
            text("""
                UPDATE customers
                SET
                    status = 'inactive',
                    updated_at = NOW()
                WHERE
                    id = :customer_id
                    AND company_id = :company_id
                RETURNING id
            """),
            {
                "customer_id":
                    customer_id,

                "company_id":
                    company_id,
            },
        ).mappings().first()

        if not customer:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=
                    "Cliente no encontrado.",
            )

        connection.execute(
            text("""
                UPDATE users
                SET
                    status = 'inactive',
                    updated_at = NOW()
                WHERE
                    customer_id = :customer_id
                    AND company_id = :company_id
            """),
            {
                "customer_id":
                    customer_id,

                "company_id":
                    company_id,
            },
        )

    return {
        "message":
            "Cliente y acceso desactivados correctamente.",
    }


def get_client_portal(
    current_user: dict,
) -> ClientPortalResponse:
    if (
        current_user[
            "role"
        ]
        != "Cliente"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,
            detail=
                "Acceso exclusivo para clientes.",
        )

    customer_id = (
        current_user.get(
            "customer_id"
        )
    )

    if not customer_id:
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,
            detail=
                "La cuenta no está vinculada a un cliente.",
        )

    company_id = (
        current_user[
            "company_id"
        ]
    )

    with engine.connect() as connection:
        row = customer_account_row(
            connection,
            company_id=
                company_id,
            customer_id=
                customer_id,
        )

        if not row:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=
                    "Cliente no encontrado.",
            )

        summary = connection.execute(
            text("""
                SELECT
                    COUNT(*) AS sales_count,

                    COALESCE(
                        SUM(total),
                        0
                    ) AS total_spent,

                    MAX(
                        sale_date
                    ) AS last_sale_at

                FROM sales

                WHERE
                    company_id = :company_id
                    AND customer_id = :customer_id
            """),
            {
                "company_id":
                    company_id,

                "customer_id":
                    customer_id,
            },
        ).mappings().one()

        sales = connection.execute(
            text("""
                SELECT
                    id,
                    sale_number,
                    sale_date,
                    total,
                    status
                FROM sales
                WHERE
                    company_id = :company_id
                    AND customer_id = :customer_id
                ORDER BY
                    sale_date DESC
                LIMIT 10
            """),
            {
                "company_id":
                    company_id,

                "customer_id":
                    customer_id,
            },
        ).mappings().all()

    return ClientPortalResponse(
        customer=
            response_from_row(
                row
            ),

        sales_count=
            int(
                summary[
                    "sales_count"
                ]
            ),

        total_spent=
            summary[
                "total_spent"
            ],

        last_sale_at=
            summary[
                "last_sale_at"
            ],

        recent_sales=[
            ClientSaleItem(
                **dict(
                    sale
                )
            )
            for sale in sales
        ],
    )
