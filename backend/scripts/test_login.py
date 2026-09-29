from getpass import getpass
import json

import httpx


URL = "http://127.0.0.1:8000/api/v1/auth/login"


def main():
    print("=" * 55)
    print("SalesIA Enterprise - Prueba de login")
    print("=" * 55)

    dni = input("DNI: ").strip()
    password = getpass("Contraseña: ")

    try:
        response = httpx.post(
            URL,
            json={
                "dni": dni,
                "password": password,
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

    except Exception as error:
        print()
        print("ERROR:", type(error).__name__)
        print(str(error))


if __name__ == "__main__":
    main()
