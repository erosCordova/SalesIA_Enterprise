from getpass import getpass

from sqlalchemy import text
from supabase import create_client

from app.core.config import settings
from app.core.database import engine


COMPANY_NAME = "SalesIA Enterprise"
ROLE_NAME = "Administrador"


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Crear administrador")
    print("=" * 60)

    first_name = input("Nombres: ").strip()
    last_name = input("Apellidos: ").strip()
    email = input("Correo: ").strip().lower()

    password = getpass("Contraseña: ")
    password_confirm = getpass("Repite la contraseña: ")

    if not first_name:
        print("[ERROR] Debes ingresar los nombres.")
        return

    if not last_name:
        print("[ERROR] Debes ingresar los apellidos.")
        return

    if not email:
        print("[ERROR] Debes ingresar el correo.")
        return

    if len(password) < 8:
        print("[ERROR] La contraseña debe tener al menos 8 caracteres.")
        return

    if password != password_confirm:
        print("[ERROR] Las contraseñas no coinciden.")
        return

    with engine.connect() as connection:
        company = connection.execute(
            text("""
                SELECT id, name
                FROM companies
                WHERE name = :company_name
                  AND status = 'active'
                LIMIT 1
            """),
            {
                "company_name": COMPANY_NAME,
            },
        ).mappings().first()

        if not company:
            print(
                "[ERROR] No se encontró la empresa "
                f"'{COMPANY_NAME}'."
            )
            return

        role = connection.execute(
            text("""
                SELECT id, name
                FROM roles
                WHERE name = :role_name
                LIMIT 1
            """),
            {
                "role_name": ROLE_NAME,
            },
        ).mappings().first()

        if not role:
            print(
                "[ERROR] No se encontró el rol "
                f"'{ROLE_NAME}'."
            )
            return

        existing_user = connection.execute(
            text("""
                SELECT id
                FROM users
                WHERE LOWER(email) = LOWER(:email)
                LIMIT 1
            """),
            {
                "email": email,
            },
        ).mappings().first()

        if existing_user:
            print(
                "[ERROR] Ya existe un usuario en public.users "
                "con ese correo."
            )
            return

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )

    auth_user_id = None

    try:
        auth_response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "first_name": first_name,
                    "last_name": last_name,
                },
            }
        )

        if not auth_response.user:
            print(
                "[ERROR] Supabase Auth no devolvió "
                "el usuario creado."
            )
            return

        auth_user_id = str(auth_response.user.id)

        with engine.begin() as connection:
            user = connection.execute(
                text("""
                    INSERT INTO users (
                        auth_user_id,
                        company_id,
                        role_id,
                        first_name,
                        last_name,
                        email,
                        status
                    )
                    VALUES (
                        :auth_user_id,
                        :company_id,
                        :role_id,
                        :first_name,
                        :last_name,
                        :email,
                        'active'
                    )
                    RETURNING
                        id,
                        auth_user_id,
                        first_name,
                        last_name,
                        email,
                        status
                """),
                {
                    "auth_user_id": auth_user_id,
                    "company_id": company["id"],
                    "role_id": role["id"],
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                },
            ).mappings().one()

        print()
        print("[OK] Administrador creado correctamente.")
        print("ID SalesIA :", user["id"])
        print("Auth ID    :", user["auth_user_id"])
        print(
            "Nombre     :",
            user["first_name"],
            user["last_name"],
        )
        print("Correo     :", user["email"])
        print("Empresa    :", company["name"])
        print("Rol        :", role["name"])
        print("Estado     :", user["status"])

    except Exception as error:
        print()
        print("[ERROR] No se pudo crear el administrador.")
        print(type(error).__name__)
        print(str(error))

        if auth_user_id:
            try:
                supabase.auth.admin.delete_user(auth_user_id)

                print(
                    "[INFO] Se eliminó el usuario de "
                    "Supabase Auth porque falló "
                    "el registro en public.users."
                )

            except Exception:
                print(
                    "[ADVERTENCIA] El usuario pudo quedar "
                    "creado en Supabase Auth."
                )


if __name__ == "__main__":
    main()
