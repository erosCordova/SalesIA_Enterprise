from fastapi import (
    APIRouter,
    Depends,
    Request,
    HTTPException,
    status,
)
from sqlalchemy import text
from supabase import create_client

from app.api.dependencies.auth import get_current_user
from app.services.audit import (
    record_audit_event,
    snapshot,
)
from app.core.config import settings
from app.core.database import engine
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserResponse,
)


router = APIRouter()


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Iniciar sesión con DNI y contraseña",
)
def login(
    request: Request,
    credentials: LoginRequest,
) -> LoginResponse:
    dni = credentials.dni.strip()

    if not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL no está configurado.",
        )

    if not settings.SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_PUBLISHABLE_KEY no está configurado.",
        )

    # ---------------------------------------------------------
    # Buscar usuario por DNI
    # ---------------------------------------------------------

    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT
                        u.id,
                        u.auth_user_id,
                        u.company_id,
                        u.customer_id,
                        u.role_id,
                        u.dni,
                        u.first_name,
                        u.last_name,
                        u.email,
                        u.phone,
                        u.status,
                        r.name AS role,
                        c.name AS company
                    FROM users u
                    INNER JOIN roles r
                        ON r.id = u.role_id
                    INNER JOIN companies c
                        ON c.id = u.company_id
                    WHERE u.dni = :dni
                    LIMIT 1
                """),
                {
                    "dni": dni,
                },
            ).mappings().first()

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo consultar la información del usuario.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DNI o contraseña incorrectos.",
        )

    # ---------------------------------------------------------
    # Validar estado
    # ---------------------------------------------------------

    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo.",
        )

    if not user["auth_user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no está vinculado al sistema de autenticación.",
        )

    if not user["email"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El usuario no tiene autenticación configurada.",
        )

    # ---------------------------------------------------------
    # Validar contraseña con Supabase Auth
    # ---------------------------------------------------------

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY,
    )

    auth_response = None

    candidate_emails = []

    stored_email = (
        str(user["email"]).strip()
        if user.get("email")
        else ""
    )

    internal_email = (
        f"{dni}@salesia.local"
    )

    if stored_email:
        candidate_emails.append(
            stored_email
        )

    if (
        internal_email
        not in candidate_emails
    ):
        candidate_emails.append(
            internal_email
        )


    for auth_email in candidate_emails:
        try:
            response = (
                supabase.auth
                .sign_in_with_password(
                    {
                        "email":
                            auth_email,

                        "password":
                            credentials.password,
                    }
                )
            )

            if (
                response.user
                and
                response.session
            ):
                auth_response = response
                break

        except Exception:
            continue


    if (
        auth_response is None
        or
        not auth_response.user
        or
        not auth_response.session
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DNI o contraseña incorrectos.",
        )

    # ---------------------------------------------------------
    # Comprobar vinculación
    # ---------------------------------------------------------

    if str(auth_response.user.id) != str(user["auth_user_id"]):
        try:
            supabase.auth.sign_out()
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de autenticación no coincide con el usuario.",
        )

    # ---------------------------------------------------------
    # Registrar último inicio de sesión
    # ---------------------------------------------------------

    try:
        with engine.begin() as connection:
            connection.execute(
                text("""
                    UPDATE users
                    SET last_login_at = NOW()
                    WHERE id = :user_id
                """),
                {
                    "user_id": user["id"],
                },
            )
    except Exception:
        pass

    # ---------------------------------------------------------
    # Respuesta
    # ---------------------------------------------------------

    session = auth_response.session

    record_audit_event(
        action="user.login",
        table_name="auth_sessions",
        record_id=user["id"],
        company_id=user["company_id"],
        user_id=user["id"],
        request=request,
        new_data={
            "status": "success",
            "auth_method": "DNI_PASSWORD",
            "dni": user["dni"],
            "role": user["role"],
            "user_name": (
                f'{user["first_name"]} '
                f'{user["last_name"]}'
            ).strip(),
        },
    )

    return LoginResponse(
        access_token=session.access_token,
        token_type="bearer",
        expires_in=getattr(
            session,
            "expires_in",
            None,
        ),
        user=UserResponse(
            id=str(user["id"]),
            auth_user_id=str(user["auth_user_id"]),
            company_id=str(user["company_id"]),
            customer_id=(
                str(user["customer_id"])
                if user["customer_id"]
                else None
            ),
            dni=user["dni"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"],
            role=user["role"],
            company=user["company"],
            status=user["status"],
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario autenticado",
)
def get_me(
    current_user: dict = Depends(
        get_current_user
    ),
) -> UserResponse:
    return UserResponse(
        id=str(current_user["id"]),
        auth_user_id=str(
            current_user["auth_user_id"]
        ),
        company_id=str(
            current_user["company_id"]
        ),
        customer_id=(
            str(
                current_user["customer_id"]
            )
            if current_user.get(
                "customer_id"
            )
            else None
        ),
        dni=current_user["dni"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        email=current_user["email"],
        role=current_user["role"],
        company=current_user["company"],
        status=current_user["status"],
    )
