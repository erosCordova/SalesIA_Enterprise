from fastapi import (
    APIRouter,
    Depends,
    Request,
    HTTPException,
    status,
)

from sqlalchemy import text

from supabase import create_client

from app.api.dependencies.auth import require_roles
from app.services.audit import (
    record_audit_event,
    snapshot,
)
from app.core.config import settings
from app.core.database import engine

from app.schemas.users import (
    RoleResponse,
    UserCreateRequest,
    UserCreatedResponse,
    UserListItem,
    UserUpdateRequest,
)


router = APIRouter()


ALLOWED_ROLES = {
    "Administrador",
    "Gerente",
    "Vendedor",
    "Analista",
    "Almacén",
}


def build_internal_email(
    dni: str,
) -> str:
    return f"{dni}@salesia.local"


def get_role(
    connection,
    role_name: str,
):
    role = connection.execute(
        text("""
            SELECT
                id,
                name
            FROM roles
            WHERE name = :role_name
            LIMIT 1
        """),
        {
            "role_name": role_name,
        },
    ).mappings().first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol seleccionado no existe.",
        )

    return role


@router.get(
    "/roles",
    response_model=list[RoleResponse],
    summary="Listar roles disponibles",
)
def list_roles(
    current_user: dict = Depends(
        require_roles(
            "Administrador"
        )
    ),
):
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT
                    id,
                    name,
                    description
                FROM roles
                WHERE name IN (
                    'Administrador',
                    'Gerente',
                    'Vendedor',
                    'Analista',
                    'Almacén'
                )
                ORDER BY name
            """)
        ).mappings().all()

    return [
        RoleResponse(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
        )
        for row in rows
    ]


@router.get(
    "",
    response_model=list[UserListItem],
    summary="Listar usuarios",
)
def list_users(
    current_user: dict = Depends(
        require_roles(
            "Administrador"
        )
    ),
):
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT
                    u.id,
                    u.dni,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    u.status,
                    r.name AS role,
                    c.name AS company
                FROM users u
                INNER JOIN roles r
                    ON r.id = u.role_id
                INNER JOIN companies c
                    ON c.id = u.company_id
                WHERE
                    u.company_id = :company_id
                ORDER BY
                    u.first_name,
                    u.last_name
            """),
            {
                "company_id":
                    current_user[
                        "company_id"
                    ],
            },
        ).mappings().all()

    return [
        UserListItem(
            id=str(row["id"]),
            dni=row["dni"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            phone=row["phone"],
            role=row["role"],
            company=row["company"],
            status=row["status"],
        )
        for row in rows
    ]


@router.post(
    "",
    response_model=UserCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
)
def create_user(
    request: Request,
    data: UserCreateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador"
        )
    ),
):
    dni = data.dni.strip()
    first_name = (
        data.first_name.strip()
    )
    last_name = (
        data.last_name.strip()
    )

    phone = (
        data.phone.strip()
        if data.phone
        else None
    )

    if data.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rol no válido.",
        )

    company_id = (
        current_user[
            "company_id"
        ]
    )

    internal_email = (
        build_internal_email(dni)
    )

    with engine.connect() as connection:
        existing_user = connection.execute(
            text("""
                SELECT id
                FROM users
                WHERE dni = :dni
                LIMIT 1
            """),
            {
                "dni": dni,
            },
        ).mappings().first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe un usuario "
                    "con ese DNI."
                ),
            )

        role = get_role(
            connection,
            data.role,
        )

        company = connection.execute(
            text("""
                SELECT
                    id,
                    name
                FROM companies
                WHERE id = :company_id
                LIMIT 1
            """),
            {
                "company_id":
                    company_id,
            },
        ).mappings().first()

        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "La empresa del "
                    "administrador no existe."
                ),
            )

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )

    auth_user_id = None

    try:
        auth_response = (
            supabase
            .auth
            .admin
            .create_user(
                {
                    "email":
                        internal_email,
                    "password":
                        data.password,
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
                                data.role,
                        },
                }
            )
        )

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Supabase Auth no "
                    "devolvió el usuario."
                ),
            )

        auth_user_id = str(
            auth_response.user.id
        )

    except HTTPException:
        raise

    except Exception as error:
        message = str(
            error
        ).lower()

        if (
            "already" in message
            or "registered" in message
            or "exists" in message
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe una cuenta "
                    "asociada a este DNI."
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No se pudo crear la "
                "cuenta de autenticación."
            ),
        )

    try:
        with engine.begin() as connection:
            created_user = (
                connection.execute(
                    text("""
                        INSERT INTO users (
                            auth_user_id,
                            company_id,
                            role_id,
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
                            :dni,
                            :first_name,
                            :last_name,
                            :email,
                            :phone,
                            :status
                        )
                        RETURNING
                            id,
                            auth_user_id,
                            dni,
                            first_name,
                            last_name,
                            phone,
                            status
                    """),
                    {
                        "auth_user_id":
                            auth_user_id,
                        "company_id":
                            company_id,
                        "role_id":
                            role["id"],
                        "dni":
                            dni,
                        "first_name":
                            first_name,
                        "last_name":
                            last_name,
                        "email":
                            internal_email,
                        "phone":
                            phone,
                        "status":
                            data.status,
                    },
                )
                .mappings()
                .one()
            )

    except Exception:
        if auth_user_id:
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No se pudo registrar "
                "el usuario."
            ),
        )

    record_audit_event(
        action="user.created",
        table_name="users",
        record_id=created_user["id"],
        current_user=current_user,
        request=request,
        new_data={
            "dni":
                created_user["dni"],

            "first_name":
                created_user[
                    "first_name"
                ],

            "last_name":
                created_user[
                    "last_name"
                ],

            "phone":
                created_user["phone"],

            "role":
                role["name"],

            "status":
                created_user["status"],
        },
    )

    return UserCreatedResponse(
        id=str(
            created_user["id"]
        ),
        auth_user_id=str(
            created_user[
                "auth_user_id"
            ]
        ),
        dni=created_user["dni"],
        first_name=created_user[
            "first_name"
        ],
        last_name=created_user[
            "last_name"
        ],
        phone=created_user["phone"],
        role=role["name"],
        company=company["name"],
        status=created_user[
            "status"
        ],
    )


@router.patch(
    "/{user_id}",
    response_model=UserListItem,
    summary="Actualizar usuario",
)
def update_user(
    request: Request,
    user_id: str,
    data: UserUpdateRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador"
        )
    ),
):
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rol no válido.",
        )

    company_id = (
        current_user[
            "company_id"
        ]
    )

    first_name = (
        data.first_name.strip()
    )

    last_name = (
        data.last_name.strip()
    )

    phone = (
        data.phone.strip()
        if data.phone
        else None
    )

    with engine.begin() as connection:
        existing = connection.execute(
            text("""
                SELECT
                    u.id,
                    u.dni,
                    u.status,
                    r.name AS role
                FROM users u
                INNER JOIN roles r
                    ON r.id = u.role_id
                WHERE
                    u.id = :user_id
                    AND
                    u.company_id = :company_id
                LIMIT 1
            """),
            {
                "user_id": user_id,
                "company_id":
                    company_id,
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Usuario no encontrado."
                ),
            )

        is_self = (
            str(existing["id"])
            == str(
                current_user["id"]
            )
        )

        if is_self:
            if (
                data.status
                != "active"
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "No puedes "
                        "desactivar tu propia "
                        "cuenta."
                    ),
                )

            if (
                data.role
                != "Administrador"
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "No puedes retirar "
                        "tu propio rol de "
                        "Administrador."
                    ),
                )

        role = get_role(
            connection,
            data.role,
        )

        row = connection.execute(
            text("""
                UPDATE users
                SET
                    first_name =
                        :first_name,
                    last_name =
                        :last_name,
                    phone =
                        :phone,
                    role_id =
                        :role_id,
                    status =
                        :status,
                    updated_at =
                        NOW()
                WHERE
                    id = :user_id
                    AND
                    company_id =
                        :company_id
                RETURNING
                    id,
                    dni,
                    first_name,
                    last_name,
                    phone,
                    status
            """),
            {
                "first_name":
                    first_name,
                "last_name":
                    last_name,
                "phone":
                    phone,
                "role_id":
                    role["id"],
                "status":
                    data.status,
                "user_id":
                    user_id,
                "company_id":
                    company_id,
            },
        ).mappings().one()

        company = connection.execute(
            text("""
                SELECT name
                FROM companies
                WHERE id = :company_id
                LIMIT 1
            """),
            {
                "company_id":
                    company_id,
            },
        ).mappings().one()

    user_audit_action = (
        "user.updated"
    )

    if (
        existing["status"]
        != row["status"]
    ):
        user_audit_action = (
            "user.activated"
            if row["status"]
            == "active"
            else "user.deactivated"
        )

    record_audit_event(
        action=user_audit_action,
        table_name="users",
        record_id=row["id"],
        current_user=current_user,
        request=request,
        old_data={
            "dni":
                existing["dni"],

            "first_name":
                existing[
                    "first_name"
                ],

            "last_name":
                existing[
                    "last_name"
                ],

            "phone":
                existing["phone"],

            "role":
                existing["role"],

            "status":
                existing["status"],
        },
        new_data={
            "dni":
                row["dni"],

            "first_name":
                row["first_name"],

            "last_name":
                row["last_name"],

            "phone":
                row["phone"],

            "role":
                role["name"],

            "status":
                row["status"],
        },
    )

    return UserListItem(
        id=str(row["id"]),
        dni=row["dni"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        phone=row["phone"],
        role=role["name"],
        company=company["name"],
        status=row["status"],
    )
