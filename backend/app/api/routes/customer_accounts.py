from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy import text
from supabase import create_client

from app.api.dependencies.auth import require_roles
from app.core.config import settings
from app.core.database import engine


router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class CustomerAccountCreateRequest(BaseModel):
    dni: str | None = None

    document_type: str | None = "DNI"
    document_number: str | None = None

    first_name: str | None = None
    last_name: str | None = None
    business_name: str | None = None

    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None

    status: str = "active"

    password: str = Field(
        ...,
        min_length=8,
    )


class CustomerAccountUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    business_name: str | None = None

    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None

    status: str | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
    )


class CustomerPortalUpdateRequest(BaseModel):
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


class CustomerPasswordChangeRequest(BaseModel):
    current_password: str = Field(
        ...,
        min_length=8,
    )

    new_password: str = Field(
        ...,
        min_length=8,
    )


# ============================================================
# HELPERS
# ============================================================

def normalize_dni(
    value: str | None,
) -> str:
    dni = "".join(
        character
        for character in str(value or "")
        if character.isdigit()
    )

    if len(dni) != 8:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=
                "El DNI debe contener exactamente 8 números.",
        )

    return dni


def clean(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    value = value.strip()

    return value or None


def get_customer_role(
    connection,
):
    role = connection.execute(
        text("""
            SELECT
                id,
                name
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

    return role


def create_supabase_user(
    *,
    dni: str,
    password: str,
    first_name: str,
    last_name: str,
):
    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )

    email = (
        f"{dni}@salesia.local"
    )

    try:
        response = (
            supabase
            .auth
            .admin
            .create_user(
                {
                    "email":
                        email,

                    "password":
                        password,

                    "email_confirm":
                        True,

                    "user_metadata":
                        {
                            "dni":
                                dni,

                            "first_name":
                                first_name,

                            "last_name":
                                last_name,

                            "role":
                                "Cliente",
                        },
                }
            )
        )

    except Exception as first_error:
        message = str(
            first_error
        ).lower()

        # Puede existir un usuario huérfano de una
        # prueba anterior. En ese caso usamos otro
        # correo interno y lo guardamos en public.users.
        if (
            "already" in message
            or "exist" in message
            or "registered" in message
        ):
            email = (
                f"{dni}."
                f"{uuid4().hex[:8]}"
                "@salesia.local"
            )

            try:
                response = (
                    supabase
                    .auth
                    .admin
                    .create_user(
                        {
                            "email":
                                email,

                            "password":
                                password,

                            "email_confirm":
                                True,

                            "user_metadata":
                                {
                                    "dni":
                                        dni,

                                    "first_name":
                                        first_name,

                                    "last_name":
                                        last_name,

                                    "role":
                                        "Cliente",
                                },
                        }
                    )
                )

            except Exception:
                raise HTTPException(
                    status_code=
                        status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=
                        "No se pudo crear la cuenta de autenticación del cliente.",
                )

        else:
            raise HTTPException(
                status_code=
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=
                    "No se pudo crear la cuenta de autenticación del cliente.",
            )

    if (
        not response.user
    ):
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=
                "Supabase no devolvió el usuario creado.",
        )

    return (
        supabase,
        response.user,
        email,
    )


# ============================================================
# LISTAR CLIENTES Y ACCESO
# ============================================================

@router.get(
    "",
    summary=
        "Listar clientes y acceso",
)
def list_accounts(
    current_user: dict =
        Depends(
            require_roles(
                "Administrador",
                "Gerente",
            )
        ),
):
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT
                    c.id AS customer_id,

                    c.document_number
                        AS dni,

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
                    u.email AS auth_email,

                    CASE
                        WHEN u.id IS NULL
                            THEN FALSE
                        ELSE TRUE
                    END AS access_enabled

                FROM customers c

                LEFT JOIN users u
                    ON u.customer_id = c.id

                WHERE
                    c.company_id =
                        :company_id

                ORDER BY
                    COALESCE(
                        c.first_name,
                        c.business_name,
                        c.document_number
                    )
            """),
            {
                "company_id":
                    current_user[
                        "company_id"
                    ],
            },
        ).mappings().all()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# CREAR CLIENTE + ACCESO
# ============================================================

@router.post(
    "",
    status_code=
        status.HTTP_201_CREATED,
    summary=
        "Crear cliente con acceso",
)
def create_account(
    data:
        CustomerAccountCreateRequest,

    current_user: dict =
        Depends(
            require_roles(
                "Administrador",
                "Gerente",
            )
        ),
):
    dni = normalize_dni(
        data.dni
        or
        data.document_number
    )

    company_id = (
        current_user[
            "company_id"
        ]
    )

    first_name = (
        clean(
            data.first_name
        )
        or
        clean(
            data.business_name
        )
        or
        "Cliente"
    )

    last_name = (
        clean(
            data.last_name
        )
        or
        ""
    )


    supabase = None
    auth_user_id = None


    try:
        with engine.begin() as connection:
            # ------------------------------------------------
            # DNI NO PUEDE EXISTIR COMO USUARIO
            # ------------------------------------------------

            existing_user = (
                connection.execute(
                    text("""
                        SELECT
                            id,
                            customer_id
                        FROM users
                        WHERE dni = :dni
                        LIMIT 1
                    """),
                    {
                        "dni":
                            dni,
                    },
                )
                .mappings()
                .first()
            )

            if existing_user:
                raise HTTPException(
                    status_code=
                        status.HTTP_409_CONFLICT,
                    detail=
                        f"Ya existe un usuario con el DNI {dni}.",
                )


            # ------------------------------------------------
            # BUSCAR CLIENTE EXISTENTE
            # ------------------------------------------------

            customer = (
                connection.execute(
                    text("""
                        SELECT
                            *
                        FROM customers
                        WHERE
                            company_id =
                                :company_id
                            AND
                            document_number =
                                :dni
                        LIMIT 1
                    """),
                    {
                        "company_id":
                            company_id,

                        "dni":
                            dni,
                    },
                )
                .mappings()
                .first()
            )


            # ------------------------------------------------
            # SI NO EXISTE, CREAR CLIENTE
            # ------------------------------------------------

            if not customer:
                customer_id = (
                    uuid4()
                )

                customer = (
                    connection.execute(
                        text("""
                            INSERT INTO customers (
                                id,
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
                                :id,
                                :company_id,

                                'DNI',
                                :dni,

                                :first_name,
                                :last_name,
                                :business_name,

                                :email,
                                :phone,
                                :address,
                                :city,

                                :status
                            )
                            RETURNING *
                        """),
                        {
                            "id":
                                customer_id,

                            "company_id":
                                company_id,

                            "dni":
                                dni,

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
                    )
                    .mappings()
                    .one()
                )


            # ------------------------------------------------
            # CREAR CUENTA EN SUPABASE
            # ------------------------------------------------

            role = (
                get_customer_role(
                    connection
                )
            )

            (
                supabase,
                auth_user,
                auth_email,
            ) = create_supabase_user(
                dni=
                    dni,

                password=
                    data.password,

                first_name=
                    first_name,

                last_name=
                    last_name,
            )

            auth_user_id = str(
                auth_user.id
            )


            # ------------------------------------------------
            # CREAR PUBLIC.USERS
            # ------------------------------------------------

            user_id = (
                uuid4()
            )

            connection.execute(
                text("""
                    INSERT INTO users (
                        id,
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
                        :id,
                        :auth_user_id,
                        :company_id,
                        :role_id,
                        :customer_id,

                        :dni,
                        :first_name,
                        :last_name,

                        :email,
                        :phone,
                        'active'
                    )
                """),
                {
                    "id":
                        user_id,

                    "auth_user_id":
                        auth_user_id,

                    "company_id":
                        company_id,

                    "role_id":
                        role[
                            "id"
                        ],

                    "customer_id":
                        customer[
                            "id"
                        ],

                    "dni":
                        dni,

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
                },
            )


            return {
                "customer_id":
                    customer[
                        "id"
                    ],

                "user_id":
                    user_id,

                "auth_user_id":
                    auth_user_id,

                "dni":
                    dni,

                "first_name":
                    customer[
                        "first_name"
                    ],

                "last_name":
                    customer[
                        "last_name"
                    ],

                "business_name":
                    customer[
                        "business_name"
                    ],

                "email":
                    customer[
                        "email"
                    ],

                "auth_email":
                    auth_email,

                "phone":
                    customer[
                        "phone"
                    ],

                "status":
                    "active",

                "role":
                    "Cliente",

                "access_enabled":
                    True,
            }

    except HTTPException:
        raise

    except Exception:
        if (
            supabase
            and
            auth_user_id
        ):
            try:
                (
                    supabase
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
                "No se pudo crear la cuenta de acceso del cliente.",
        )


# ============================================================
# PORTAL DEL CLIENTE
# IMPORTANTE: ANTES DE /{customer_id}
# ============================================================

@router.get(
    "/portal/me",
    summary=
        "Obtener portal del cliente",
)
def portal_me(
    current_user: dict =
        Depends(
            require_roles(
                "Cliente"
            )
        ),
):
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


    with engine.connect() as connection:
        customer = (
            connection.execute(
                text("""
                    SELECT *
                    FROM customers
                    WHERE
                        id = :customer_id
                    LIMIT 1
                """),
                {
                    "customer_id":
                        customer_id,
                },
            )
            .mappings()
            .first()
        )


        sales = (
            connection.execute(
                text("""
                    SELECT
                        id,
                        sale_number,
                        sale_date,
                        subtotal,
                        discount,
                        tax,
                        total,
                        status
                    FROM sales
                    WHERE
                        customer_id =
                            :customer_id
                    ORDER BY
                        sale_date DESC
                """),
                {
                    "customer_id":
                        customer_id,
                },
            )
            .mappings()
            .all()
        )


        sale_details = (
            connection.execute(
                text("""
                    SELECT
                        sd.sale_id,
                        sd.product_id,

                        p.sku,
                        p.name AS product_name,
                        p.unit,

                        sd.quantity,
                        sd.unit_price,
                        sd.discount,
                        sd.subtotal

                    FROM sale_details sd

                    INNER JOIN sales s
                        ON s.id = sd.sale_id

                    LEFT JOIN products p
                        ON p.id = sd.product_id

                    WHERE
                        s.customer_id =
                            :customer_id

                    ORDER BY
                        s.sale_date DESC,
                        p.name ASC
                """),
                {
                    "customer_id":
                        customer_id,
                },
            )
            .mappings()
            .all()
        )


    if not customer:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=
                "Cliente no encontrado.",
        )


    details_by_sale = {}

    for row in sale_details:
        sale_id = str(
            row["sale_id"]
        )

        details_by_sale.setdefault(
            sale_id,
            [],
        ).append(
            dict(row)
        )


    sales_response = []

    for row in sales:
        sale = dict(
            row
        )

        sale["items"] = (
            details_by_sale.get(
                str(
                    row["id"]
                ),
                [],
            )
        )

        sales_response.append(
            sale
        )


    return {
        "customer":
            dict(
                customer
            ),

        "sales":
            sales_response,
    }


# ============================================================
# ACTUALIZAR MI PERFIL
# ============================================================

@router.put(
    "/portal/me",
    summary="Actualizar mi perfil",
)
def update_my_profile(
    data: CustomerPortalUpdateRequest,

    current_user: dict =
        Depends(
            require_roles(
                "Cliente"
            )
        ),
):
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

    values = {
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
    }

    with engine.begin() as connection:
        customer = (
            connection.execute(
                text("""
                    UPDATE customers

                    SET
                        email = :email,
                        phone = :phone,
                        address = :address,
                        city = :city,
                        updated_at = NOW()

                    WHERE
                        id = :customer_id

                    RETURNING *
                """),
                {
                    **values,

                    "customer_id":
                        customer_id,
                },
            )
            .mappings()
            .first()
        )

    if not customer:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Cliente no encontrado.",
        )

    return dict(
        customer
    )


# ============================================================
# CAMBIAR MI CONTRASEÑA
# ============================================================

@router.put(
    "/portal/password",
    summary="Cambiar mi contraseña",
)
def change_customer_password(
    data: CustomerPasswordChangeRequest,

    current_user: dict =
        Depends(
            require_roles(
                "Cliente"
            )
        ),
):
    auth_user_id = (
        current_user.get(
            "auth_user_id"
        )
    )

    dni = str(
        current_user.get(
            "dni"
        )
        or ""
    ).strip()

    stored_email = str(
        current_user.get(
            "email"
        )
        or ""
    ).strip()


    if not auth_user_id:
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,

            detail=
                "La cuenta no está vinculada al sistema de autenticación.",
        )


    if (
        data.current_password
        ==
        data.new_password
    ):
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,

            detail=
                "La nueva contraseña debe ser diferente a la actual.",
        )


    # --------------------------------------------------------
    # VALIDAR CONTRASEÑA ACTUAL
    # --------------------------------------------------------

    auth_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY,
    )


    candidate_emails = []

    if stored_email:
        candidate_emails.append(
            stored_email
        )

    if dni:
        internal_email = (
            f"{dni}@salesia.local"
        )

        if (
            internal_email
            not in candidate_emails
        ):
            candidate_emails.append(
                internal_email
            )


    valid_password = False


    for email in candidate_emails:
        try:
            response = (
                auth_client
                .auth
                .sign_in_with_password(
                    {
                        "email":
                            email,

                        "password":
                            data.current_password,
                    }
                )
            )

            if (
                response.user
                and
                str(
                    response.user.id
                )
                ==
                str(
                    auth_user_id
                )
            ):
                valid_password = True
                break

        except Exception:
            continue


    try:
        auth_client.auth.sign_out()
    except Exception:
        pass


    if not valid_password:
        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=
                "La contraseña actual es incorrecta.",
        )


    # --------------------------------------------------------
    # CAMBIAR CONTRASEÑA
    # --------------------------------------------------------

    admin_client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )


    try:
        (
            admin_client
            .auth
            .admin
            .update_user_by_id(
                str(
                    auth_user_id
                ),
                {
                    "password":
                        data.new_password,
                },
            )
        )

    except Exception as exc:
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=
                "No se pudo actualizar la contraseña.",
        ) from exc


    return {
        "message":
            "Contraseña actualizada correctamente."
    }


# ============================================================
# ACTUALIZAR CLIENTE + ACCESO
# ============================================================

@router.put(
    "/{customer_id}",
    summary=
        "Actualizar cliente y acceso",
)
def update_account(
    customer_id: UUID,

    data:
        CustomerAccountUpdateRequest,

    current_user: dict =
        Depends(
            require_roles(
                "Administrador",
                "Gerente",
            )
        ),
):
    company_id = (
        current_user[
            "company_id"
        ]
    )


    with engine.begin() as connection:
        customer = (
            connection.execute(
                text("""
                    SELECT *
                    FROM customers
                    WHERE
                        id =
                            :customer_id
                        AND
                        company_id =
                            :company_id
                    LIMIT 1
                """),
                {
                    "customer_id":
                        customer_id,

                    "company_id":
                        company_id,
                },
            )
            .mappings()
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=
                    "Cliente no encontrado.",
            )


        values = (
            data.model_dump(
                exclude_unset=True,
                exclude={
                    "password",
                },
            )
        )

        allowed = {
            "first_name",
            "last_name",
            "business_name",
            "email",
            "phone",
            "address",
            "city",
            "status",
        }

        values = {
            key:
                value
            for key, value
            in values.items()
            if key in allowed
        }


        if values:
            assignments = (
                ", ".join(
                    f"{key} = :{key}"
                    for key
                    in values
                )
            )

            connection.execute(
                text(
                    f"""
                    UPDATE customers
                    SET
                        {assignments},
                        updated_at = NOW()
                    WHERE
                        id =
                            :customer_id
                    """
                ),
                {
                    **values,
                    "customer_id":
                        customer_id,
                },
            )


        user = (
            connection.execute(
                text("""
                    SELECT
                        id,
                        auth_user_id
                    FROM users
                    WHERE
                        customer_id =
                            :customer_id
                    LIMIT 1
                """),
                {
                    "customer_id":
                        customer_id,
                },
            )
            .mappings()
            .first()
        )


        if (
            data.status
            and
            user
        ):
            connection.execute(
                text("""
                    UPDATE users
                    SET
                        status = :status,
                        updated_at = NOW()
                    WHERE id = :user_id
                """),
                {
                    "status":
                        data.status,

                    "user_id":
                        user[
                            "id"
                        ],
                },
            )


    if (
        data.password
        and
        user
        and
        user[
            "auth_user_id"
        ]
    ):
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY,
        )

        try:
            (
                supabase
                .auth
                .admin
                .update_user_by_id(
                    str(
                        user[
                            "auth_user_id"
                        ]
                    ),
                    {
                        "password":
                            data.password,
                    },
                )
            )
        except Exception:
            raise HTTPException(
                status_code=
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=
                    "Los datos fueron actualizados, pero no se pudo cambiar la contraseña.",
            )


    return {
        "message":
            "Cliente actualizado correctamente.",

        "customer_id":
            customer_id,
    }


# ============================================================
# DESACTIVAR
# ============================================================

@router.delete(
    "/{customer_id}",
    summary=
        "Desactivar cliente y acceso",
)
def deactivate_account(
    customer_id: UUID,

    current_user: dict =
        Depends(
            require_roles(
                "Administrador",
                "Gerente",
            )
        ),
):
    with engine.begin() as connection:
        customer = (
            connection.execute(
                text("""
                    SELECT id
                    FROM customers
                    WHERE
                        id =
                            :customer_id
                        AND
                        company_id =
                            :company_id
                    LIMIT 1
                """),
                {
                    "customer_id":
                        customer_id,

                    "company_id":
                        current_user[
                            "company_id"
                        ],
                },
            )
            .mappings()
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=
                    "Cliente no encontrado.",
            )


        connection.execute(
            text("""
                UPDATE customers
                SET
                    status = 'inactive',
                    updated_at = NOW()
                WHERE id = :customer_id
            """),
            {
                "customer_id":
                    customer_id,
            },
        )


        connection.execute(
            text("""
                UPDATE users
                SET
                    status = 'inactive',
                    updated_at = NOW()
                WHERE
                    customer_id =
                        :customer_id
            """),
            {
                "customer_id":
                    customer_id,
            },
        )


    return {
        "message":
            "Cliente y acceso desactivados correctamente.",
    }
