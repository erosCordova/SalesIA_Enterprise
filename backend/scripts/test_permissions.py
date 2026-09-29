from getpass import getpass
import json

import httpx


BASE_URL = "http://127.0.0.1:8000/api/v1"


def print_response(title: str, response: httpx.Response) -> None:
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)
    print("STATUS:", response.status_code)

    try:
        print(
            json.dumps(
                response.json(),
                indent=2,
                ensure_ascii=False,
            )
        )
    except Exception:
        print(response.text)


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Prueba de permisos")
    print("=" * 60)

    dni = input("DNI del Vendedor: ").strip()
    password = getpass("Contraseña: ")

    # ---------------------------------------------------------
    # 1. Login del Vendedor
    # ---------------------------------------------------------

    login_response = httpx.post(
        f"{BASE_URL}/auth/login",
        json={
            "dni": dni,
            "password": password,
        },
        timeout=30,
    )

    print_response(
        "1. LOGIN DEL VENDEDOR",
        login_response,
    )

    if login_response.status_code != 200:
        return

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}",
    }

    # ---------------------------------------------------------
    # 2. Intentar consultar usuarios
    # ---------------------------------------------------------

    users_response = httpx.get(
        f"{BASE_URL}/users",
        headers=headers,
        timeout=30,
    )

    print_response(
        "2. VENDEDOR INTENTA LISTAR USUARIOS",
        users_response,
    )

    # ---------------------------------------------------------
    # 3. Intentar crear usuario
    # ---------------------------------------------------------

    create_response = httpx.post(
        f"{BASE_URL}/users",
        headers=headers,
        json={
            "dni": "11223344",
            "first_name": "Intento",
            "last_name": "Sin Permiso",
            "password": "Prueba@2026",
            "role": "Vendedor",
            "phone": None,
            "status": "active",
        },
        timeout=30,
    )

    print_response(
        "3. VENDEDOR INTENTA CREAR USUARIO",
        create_response,
    )

    print()
    print("=" * 60)
    print("RESULTADO ESPERADO")
    print("=" * 60)

    if (
        login_response.status_code == 200
        and users_response.status_code == 403
        and create_response.status_code == 403
    ):
        print("[OK] Los permisos por rol funcionan correctamente.")
        print("El Vendedor puede iniciar sesión.")
        print("El Vendedor NO puede administrar usuarios.")
    else:
        print("[REVISAR] Alguna validación no devolvió lo esperado.")


if __name__ == "__main__":
    main()
