from getpass import getpass
import json

import httpx


BASE_URL = "http://127.0.0.1:8000/api/v1"


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Crear usuario de prueba")
    print("=" * 60)

    print()
    print("Credenciales del Administrador")
    print("-" * 60)

    admin_dni = input("DNI administrador: ").strip()
    admin_password = getpass("Contraseña administrador: ")

    login_response = httpx.post(
        f"{BASE_URL}/auth/login",
        json={
            "dni": admin_dni,
            "password": admin_password,
        },
        timeout=30,
    )

    if login_response.status_code != 200:
        print()
        print("ERROR LOGIN:", login_response.status_code)
        print(login_response.text)
        return

    token = login_response.json()["access_token"]

    print()
    print("Datos del nuevo usuario")
    print("-" * 60)

    dni = input("DNI: ").strip()
    first_name = input("Nombres: ").strip()
    last_name = input("Apellidos: ").strip()
    phone = input("Teléfono opcional: ").strip()
    password = getpass("Contraseña: ")

    print()
    print("Roles disponibles:")
    print("1. Administrador")
    print("2. Gerente")
    print("3. Vendedor")
    print("4. Analista")
    print("5. Almacén")

    option = input("Seleccione rol: ").strip()

    roles = {
        "1": "Administrador",
        "2": "Gerente",
        "3": "Vendedor",
        "4": "Analista",
        "5": "Almacén",
    }

    role = roles.get(option)

    if not role:
        print("Rol no válido.")
        return

    response = httpx.post(
        f"{BASE_URL}/users",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "dni": dni,
            "first_name": first_name,
            "last_name": last_name,
            "password": password,
            "role": role,
            "phone": phone or None,
            "status": "active",
        },
        timeout=30,
    )

    print()
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


if __name__ == "__main__":
    main()
