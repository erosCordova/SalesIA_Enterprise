from getpass import getpass
import json

import httpx


BASE_URL = "http://127.0.0.1:8000/api/v1"


def print_json(data):
    print(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
        )
    )


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Prueba de usuario autenticado")
    print("=" * 60)

    dni = input("DNI: ").strip()
    password = getpass("Contraseña: ")

    # ---------------------------------------------------------
    # Login
    # ---------------------------------------------------------

    login_response = httpx.post(
        f"{BASE_URL}/auth/login",
        json={
            "dni": dni,
            "password": password,
        },
        timeout=30,
    )

    print()
    print("LOGIN STATUS:", login_response.status_code)

    if login_response.status_code != 200:
        try:
            print_json(login_response.json())
        except Exception:
            print(login_response.text)
        return

    login_data = login_response.json()

    print_json(login_data)

    token = login_data["access_token"]

    # ---------------------------------------------------------
    # /auth/me
    # ---------------------------------------------------------

    me_response = httpx.get(
        f"{BASE_URL}/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
        timeout=30,
    )

    print()
    print("=" * 60)
    print("GET /auth/me")
    print("=" * 60)
    print("STATUS:", me_response.status_code)

    try:
        print_json(me_response.json())
    except Exception:
        print(me_response.text)

    if me_response.status_code == 200:
        print()
        print("[OK] Token reconocido correctamente.")
        print(
            "Usuario:",
            me_response.json()["first_name"],
            me_response.json()["last_name"],
        )
        print(
            "Rol:",
            me_response.json()["role"],
        )


if __name__ == "__main__":
    main()
