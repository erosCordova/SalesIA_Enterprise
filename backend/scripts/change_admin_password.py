from getpass import getpass

from sqlalchemy import text
from supabase import create_client

from app.core.config import settings
from app.core.database import engine


ADMIN_DNI = "87654321"


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Cambiar contraseña")
    print("=" * 60)

    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT
                    id,
                    auth_user_id,
                    dni,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE dni = :dni
                LIMIT 1
            """),
            {
                "dni": ADMIN_DNI,
            },
        ).mappings().first()

    if not user:
        print("[ERROR] No se encontró el administrador.")
        return

    if not user["auth_user_id"]:
        print("[ERROR] El usuario no está vinculado con Supabase Auth.")
        return

    print(
        "Usuario:",
        user["first_name"],
        user["last_name"],
    )
    print("DNI:", user["dni"])

    new_password = getpass("Nueva contraseña: ")
    confirm_password = getpass("Repite la nueva contraseña: ")

    if len(new_password) < 8:
        print("[ERROR] La contraseña debe tener al menos 8 caracteres.")
        return

    if new_password != confirm_password:
        print("[ERROR] Las contraseñas no coinciden.")
        return

    try:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY,
        )

        supabase.auth.admin.update_user_by_id(
            str(user["auth_user_id"]),
            {
                "password": new_password,
            },
        )

        print()
        print("[OK] Contraseña actualizada correctamente.")
        print("DNI:", user["dni"])

    except Exception as error:
        print()
        print("[ERROR] No se pudo cambiar la contraseña.")
        print(type(error).__name__)
        print(str(error))


if __name__ == "__main__":
    main()
