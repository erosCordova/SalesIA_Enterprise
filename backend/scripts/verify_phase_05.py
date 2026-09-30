import getpass
import secrets
import sys
import traceback
import warnings
from decimal import Decimal

warnings.filterwarnings(
    "ignore",
    message="Using `httpx` with `starlette.testclient` is deprecated",
)

from fastapi.testclient import TestClient
from sqlalchemy import text
from supabase import create_client

from app.core.config import settings
from app.core.database import engine
from app.main import app
from app.services import statistics as statistics_service


# ==========================================================
# CONFIGURACIÓN
# ==========================================================

client = TestClient(
    app,
    raise_server_exceptions=True,
)

created = {
    "auth_user_id": None,
    "user_id": None,
    "customer_id": None,
    "category_id": None,
    "product_id": None,
    "sale_id": None,
}


# ==========================================================
# UTILIDADES
# ==========================================================

def ok(message):
    print(f"[OK] {message}")


def fail(message):
    raise AssertionError(message)


def response_text(response):
    try:
        return str(response.json())
    except Exception:
        return response.text


def require_status(
    response,
    expected,
    message,
):
    if response.status_code != expected:
        fail(
            f"{message}. "
            f"HTTP={response.status_code}. "
            f"Respuesta={response_text(response)}"
        )

    ok(message)


def cleanup():
    print()
    print("==============================================")
    print("LIMPIEZA DE DATOS TEMPORALES")
    print("==============================================")

    try:
        with engine.begin() as connection:

            if created["sale_id"]:
                sale_id = created["sale_id"]

                connection.execute(
                    text("""
                        DELETE FROM payments
                        WHERE sale_id = :sale_id
                    """),
                    {
                        "sale_id": sale_id,
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM inventory_movements
                        WHERE reference_id = :sale_id
                    """),
                    {
                        "sale_id": sale_id,
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM sale_details
                        WHERE sale_id = :sale_id
                    """),
                    {
                        "sale_id": sale_id,
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM sales
                        WHERE id = :sale_id
                    """),
                    {
                        "sale_id": sale_id,
                    },
                )

            if created["product_id"]:
                product_id = created["product_id"]

                connection.execute(
                    text("""
                        DELETE FROM inventory_movements
                        WHERE product_id = :product_id
                    """),
                    {
                        "product_id": product_id,
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM inventory
                        WHERE product_id = :product_id
                    """),
                    {
                        "product_id": product_id,
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM products
                        WHERE id = :product_id
                    """),
                    {
                        "product_id": product_id,
                    },
                )

            if created["category_id"]:
                connection.execute(
                    text("""
                        DELETE FROM categories
                        WHERE id = :category_id
                    """),
                    {
                        "category_id":
                            created["category_id"],
                    },
                )

            if created["customer_id"]:
                connection.execute(
                    text("""
                        DELETE FROM customers
                        WHERE id = :customer_id
                    """),
                    {
                        "customer_id":
                            created["customer_id"],
                    },
                )

            if created["user_id"]:
                connection.execute(
                    text("""
                        DELETE FROM audit_logs
                        WHERE user_id = :user_id
                    """),
                    {
                        "user_id":
                            created["user_id"],
                    },
                )

                connection.execute(
                    text("""
                        DELETE FROM users
                        WHERE id = :user_id
                    """),
                    {
                        "user_id":
                            created["user_id"],
                    },
                )

        if created["auth_user_id"]:
            try:
                supabase = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SECRET_KEY,
                )

                supabase.auth.admin.delete_user(
                    str(created["auth_user_id"])
                )

            except Exception as error:
                print(
                    "[AVISO] No se pudo eliminar "
                    "el usuario temporal de Auth:",
                    error,
                )

        ok("Datos temporales eliminados")

    except Exception:
        print(
            "[AVISO] Ocurrió un problema durante "
            "la limpieza."
        )
        traceback.print_exc()


# ==========================================================
# CREDENCIALES
# ==========================================================

print()
print("==============================================")
print("SALESIA ENTERPRISE")
print("VERIFICACIÓN COMPLETA - FASE 05")
print("==============================================")
print()

admin_dni = input(
    "DNI del Administrador: "
).strip()

admin_password = getpass.getpass(
    "Contraseña del Administrador: "
)


# ==========================================================
# PRUEBAS
# ==========================================================

success = False

try:

    # ------------------------------------------------------
    # 1. FASTAPI
    # ------------------------------------------------------

    print()
    print("=== 1. FASTAPI ===")

    response = client.get(
        "/api/v1/health"
    )

    require_status(
        response,
        200,
        "FastAPI responde correctamente",
    )


    # ------------------------------------------------------
    # 2. OPENAPI
    # ------------------------------------------------------

    print()
    print("=== 2. OPENAPI ===")

    required_paths = {
        "/api/v1/auth/login",
        "/api/v1/auth/me",
        "/api/v1/customers",
        "/api/v1/categories",
        "/api/v1/products",
        "/api/v1/sales",
        "/api/v1/inventory",
        "/api/v1/dashboard/summary",
        "/api/v1/statistics/mean",
        "/api/v1/statistics/median",
        "/api/v1/statistics/compare",
        "/api/v1/probability/bayes",
        "/api/v1/random-variables/analyze",
        "/api/v1/insights",
        "/api/v1/reports",
    }

    openapi = app.openapi()

    actual_paths = set(
        openapi["paths"].keys()
    )

    missing = (
        required_paths
        - actual_paths
    )

    if missing:
        fail(
            "Faltan endpoints: "
            + ", ".join(
                sorted(missing)
            )
        )

    ok(
        "Endpoints requeridos presentes "
        "en OpenAPI"
    )


    # ------------------------------------------------------
    # 3. SERVICIOS ESTADÍSTICOS
    # ------------------------------------------------------

    print()
    print("=== 3. SERVICIOS ESTADÍSTICOS ===")

    statistical_functions = [
        "calculate_mean",
        "calculate_median",
        "compare_statistics",
        "calculate_bayes",
        "analyze_random_variable",
    ]

    for function_name in statistical_functions:
        function = getattr(
            statistics_service,
            function_name,
            None,
        )

        if not callable(function):
            fail(
                "No existe el servicio: "
                + function_name
            )

        ok(
            f"Servicio disponible: {function_name}"
        )


    # ------------------------------------------------------
    # 4. CONSTRAINTS POSTGRESQL
    # ------------------------------------------------------

    print()
    print("=== 4. CONSTRAINTS POSTGRESQL ===")

    with engine.connect() as connection:

        inventory_constraint = (
            connection.execute(
                text("""
                    SELECT
                        pg_get_constraintdef(c.oid)
                    FROM pg_constraint c
                    INNER JOIN pg_class t
                        ON t.oid = c.conrelid
                    WHERE
                        t.relname =
                            'inventory_movements'
                        AND c.conname =
                            'chk_inventory_movement_type'
                """)
            ).scalar_one()
        )

        payment_constraint = (
            connection.execute(
                text("""
                    SELECT
                        pg_get_constraintdef(c.oid)
                    FROM pg_constraint c
                    INNER JOIN pg_class t
                        ON t.oid = c.conrelid
                    WHERE
                        t.relname = 'payments'
                        AND c.conname =
                            'chk_payment_method'
                """)
            ).scalar_one()
        )

    if "exit" not in inventory_constraint:
        fail(
            "PostgreSQL no permite "
            "movement_type='exit'."
        )

    ok(
        "Inventario permite movement_type='exit'"
    )

    payment_methods = [
        "cash",
        "card",
        "transfer",
        "yape",
        "plin",
        "other",
    ]

    for method in payment_methods:
        if method not in payment_constraint:
            fail(
                f"PostgreSQL no permite "
                f"payment_method='{method}'."
            )

    ok(
        "Métodos de pago alineados "
        "con PostgreSQL"
    )


    # ------------------------------------------------------
    # 5. LOGIN ADMINISTRADOR
    # ------------------------------------------------------

    print()
    print("=== 5. AUTENTICACIÓN ADMINISTRADOR ===")

    response = client.post(
        "/api/v1/auth/login",
        json={
            "dni": admin_dni,
            "password": admin_password,
        },
    )

    require_status(
        response,
        200,
        "Login del Administrador",
    )

    admin_login = response.json()

    if (
        admin_login["user"]["role"]
        != "Administrador"
    ):
        fail(
            "El usuario autenticado "
            "no tiene rol Administrador."
        )

    ok(
        "Rol Administrador verificado"
    )

    admin_headers = {
        "Authorization":
            "Bearer "
            + admin_login["access_token"]
    }


    # ------------------------------------------------------
    # 6. AUTH / ME
    # ------------------------------------------------------

    print()
    print("=== 6. TOKEN ===")

    response = client.get(
        "/api/v1/auth/me",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "/auth/me valida el token",
    )


    # ------------------------------------------------------
    # 7. VALIDACIÓN PAYMENT_METHOD
    # ------------------------------------------------------

    print()
    print("=== 7. VALIDACIÓN DE MÉTODO DE PAGO ===")

    response = client.post(
        "/api/v1/sales",
        headers=admin_headers,
        json={
            "items": [
                {
                    "product_id":
                        "00000000-0000-0000-0000-000000000001",
                    "quantity": 1,
                    "discount": 0,
                }
            ],
            "sale_discount": 0,
            "tax_rate": 0.18,
            "payment_method": "Efectivo",
        },
    )

    require_status(
        response,
        422,
        "Método de pago inválido "
        "es rechazado por FastAPI",
    )


    # ------------------------------------------------------
    # 8. CREAR VENDEDOR
    # ------------------------------------------------------

    print()
    print("=== 8. AUTORIZACIÓN POR ROLES ===")

    while True:
        seller_dni = str(
            secrets.randbelow(
                90_000_000
            )
            + 10_000_000
        )

        with engine.connect() as connection:
            exists = connection.execute(
                text("""
                    SELECT 1
                    FROM users
                    WHERE dni = :dni
                    LIMIT 1
                """),
                {
                    "dni": seller_dni,
                },
            ).first()

        if not exists:
            break

    seller_password = (
        "SalesIA2026_Test!"
    )

    response = client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={
            "dni": seller_dni,
            "first_name": "Usuario",
            "last_name": "Temporal",
            "password": seller_password,
            "role": "Vendedor",
            "phone": None,
            "status": "active",
        },
    )

    require_status(
        response,
        201,
        "Administrador puede crear usuarios",
    )

    seller_data = response.json()

    created["user_id"] = (
        seller_data["id"]
    )

    created["auth_user_id"] = (
        seller_data["auth_user_id"]
    )


    # ------------------------------------------------------
    # 9. LOGIN VENDEDOR
    # ------------------------------------------------------

    response = client.post(
        "/api/v1/auth/login",
        json={
            "dni": seller_dni,
            "password": seller_password,
        },
    )

    require_status(
        response,
        200,
        "Vendedor puede iniciar sesión",
    )

    seller_login = response.json()

    seller_headers = {
        "Authorization":
            "Bearer "
            + seller_login["access_token"]
    }


    # ------------------------------------------------------
    # 10. PERMISOS DEL VENDEDOR
    # ------------------------------------------------------

    response = client.get(
        "/api/v1/users",
        headers=seller_headers,
    )

    require_status(
        response,
        403,
        "Vendedor no puede administrar usuarios",
    )


    # ------------------------------------------------------
    # 11. CLIENTE
    # ------------------------------------------------------

    print()
    print("=== 9. CLIENTE / CATEGORÍA / PRODUCTO ===")

    suffix = secrets.token_hex(4)

    ruc = str(
        20_000_000_000
        + secrets.randbelow(
            9_000_000_000
        )
    )

    response = client.post(
        "/api/v1/customers",
        headers=admin_headers,
        json={
            "document_type": "RUC",
            "document_number": ruc,
            "business_name":
                f"Cliente Temporal {suffix}",
            "email":
                f"{suffix}@test.salesia.local",
            "phone": "999999999",
            "address": "Dirección temporal",
            "city": "Lima",
            "status": "active",
        },
    )

    require_status(
        response,
        201,
        "Cliente creado",
    )

    created["customer_id"] = (
        response.json()["id"]
    )


    # ------------------------------------------------------
    # 12. CATEGORÍA
    # ------------------------------------------------------

    response = client.post(
        "/api/v1/categories",
        headers=admin_headers,
        json={
            "name":
                f"Categoria Temporal {suffix}",
            "description":
                "Categoría temporal "
                "para verificar Fase 05",
            "status": "active",
        },
    )

    require_status(
        response,
        201,
        "Categoría creada",
    )

    created["category_id"] = (
        response.json()["id"]
    )


    # ------------------------------------------------------
    # 13. PRODUCTO
    # ------------------------------------------------------

    response = client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={
            "category_id":
                created["category_id"],
            "sku":
                f"TEST-{suffix.upper()}",
            "name":
                f"Producto Temporal {suffix}",
            "description":
                "Producto temporal "
                "para verificar Fase 05",
            "unit": "unidad",
            "sale_price": 100,
            "cost_price": 60,
            "initial_stock": 10,
            "minimum_stock": 2,
            "maximum_stock": 20,
            "status": "active",
        },
    )

    require_status(
        response,
        201,
        "Producto creado",
    )

    created["product_id"] = (
        response.json()["id"]
    )


    # ------------------------------------------------------
    # 14. INVENTARIO INICIAL
    # ------------------------------------------------------

    print()
    print("=== 10. INVENTARIO INICIAL ===")

    response = client.get(
        "/api/v1/inventory",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Inventario consultado",
    )

    inventory_item = next(
        (
            item
            for item in response.json()
            if (
                str(item["product_id"])
                == str(
                    created["product_id"]
                )
            )
        ),
        None,
    )

    if inventory_item is None:
        fail(
            "No se encontró inventario "
            "para el producto temporal."
        )

    stock_before = Decimal(
        str(
            inventory_item[
                "stock_quantity"
            ]
        )
    )

    if stock_before != Decimal("10"):
        fail(
            f"Stock inicial incorrecto: "
            f"{stock_before}"
        )

    ok(
        "Stock inicial = 10"
    )


    # ------------------------------------------------------
    # 15. VENTA REAL
    # ------------------------------------------------------

    print()
    print("=== 11. VENTA TRANSACCIONAL ===")

    response = client.post(
        "/api/v1/sales",
        headers=admin_headers,
        json={
            "customer_id":
                created["customer_id"],
            "items": [
                {
                    "product_id":
                        created["product_id"],
                    "quantity": 2,
                    "discount": 0,
                }
            ],
            "sale_discount": 0,
            "tax_rate": 0.18,
            "payment_method": "cash",
            "payment_reference":
                f"TEST-{suffix}",
            "notes":
                "Prueba automática "
                "de Fase 05",
        },
    )

    require_status(
        response,
        201,
        "Venta registrada correctamente",
    )

    sale_data = response.json()

    created["sale_id"] = (
        sale_data["id"]
    )

    if (
        sale_data["status"]
        != "completed"
    ):
        fail(
            "La venta no quedó "
            "en estado completed."
        )

    ok(
        "Venta finalizada como completed"
    )

    if (
        sale_data["payment_method"]
        != "cash"
    ):
        fail(
            "La respuesta de venta no "
            "devuelve payment_method=cash."
        )

    ok(
        "Método de pago cash correcto"
    )


    # ------------------------------------------------------
    # 16. INVENTARIO DESPUÉS DE VENTA
    # ------------------------------------------------------

    print()
    print("=== 12. ACTUALIZACIÓN DE INVENTARIO ===")

    response = client.get(
        "/api/v1/inventory",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Inventario consultado después "
        "de la venta",
    )

    inventory_item = next(
        (
            item
            for item in response.json()
            if (
                str(item["product_id"])
                == str(
                    created["product_id"]
                )
            )
        ),
        None,
    )

    if inventory_item is None:
        fail(
            "No se encontró el inventario "
            "después de la venta."
        )

    stock_after = Decimal(
        str(
            inventory_item[
                "stock_quantity"
            ]
        )
    )

    if stock_after != Decimal("8"):
        fail(
            f"Stock esperado=8, "
            f"stock real={stock_after}"
        )

    ok(
        "Venta actualiza inventario 10 -> 8"
    )


    # ------------------------------------------------------
    # 17. PERSISTENCIA TRANSACCIONAL
    # ------------------------------------------------------

    print()
    print("=== 13. PERSISTENCIA POSTGRESQL ===")

    with engine.connect() as connection:

        sale_row = (
            connection.execute(
                text("""
                    SELECT
                        status,
                        total
                    FROM sales
                    WHERE id = :sale_id
                """),
                {
                    "sale_id":
                        created["sale_id"],
                },
            )
            .mappings()
            .one()
        )

        detail_count = (
            connection.execute(
                text("""
                    SELECT COUNT(*)
                    FROM sale_details
                    WHERE sale_id = :sale_id
                """),
                {
                    "sale_id":
                        created["sale_id"],
                },
            )
            .scalar_one()
        )

        payment_row = (
            connection.execute(
                text("""
                    SELECT
                        payment_method,
                        status,
                        amount
                    FROM payments
                    WHERE sale_id = :sale_id
                    LIMIT 1
                """),
                {
                    "sale_id":
                        created["sale_id"],
                },
            )
            .mappings()
            .one()
        )

        movement_row = (
            connection.execute(
                text("""
                    SELECT
                        movement_type,
                        quantity,
                        reference_type
                    FROM inventory_movements
                    WHERE reference_id = :sale_id
                    LIMIT 1
                """),
                {
                    "sale_id":
                        created["sale_id"],
                },
            )
            .mappings()
            .one()
        )

    if sale_row["status"] != "completed":
        fail(
            "sales.status no es completed."
        )

    ok(
        "Cabecera de venta persistida"
    )

    if detail_count != 1:
        fail(
            "El detalle de venta "
            "no fue persistido correctamente."
        )

    ok(
        "Detalle de venta persistido"
    )

    if (
        payment_row["payment_method"]
        != "cash"
    ):
        fail(
            "payments.payment_method "
            "no es cash."
        )

    if (
        payment_row["status"]
        != "completed"
    ):
        fail(
            "payments.status "
            "no es completed."
        )

    ok(
        "Pago persistido correctamente"
    )

    if (
        movement_row["movement_type"]
        != "exit"
    ):
        fail(
            "inventory_movements."
            "movement_type no es exit."
        )

    if (
        movement_row["reference_type"]
        != "sale"
    ):
        fail(
            "El movimiento no está "
            "relacionado con la venta."
        )

    ok(
        "Movimiento de inventario = exit"
    )


    # ------------------------------------------------------
    # 18. CONSULTA DE VENTAS
    # ------------------------------------------------------

    print()
    print("=== 14. CONSULTA DE VENTAS ===")

    response = client.get(
        "/api/v1/sales",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Listado de ventas disponible",
    )

    sale_exists = any(
        str(item["id"])
        == str(created["sale_id"])
        for item in response.json()
    )

    if not sale_exists:
        fail(
            "La venta creada no aparece "
            "en GET /sales."
        )

    ok(
        "Venta disponible en consulta"
    )


    # ------------------------------------------------------
    # 19. DASHBOARD
    # ------------------------------------------------------

    print()
    print("=== 15. DASHBOARD ===")

    response = client.get(
        "/api/v1/dashboard/summary",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Dashboard summary responde",
    )


    # ------------------------------------------------------
    # 20. INSIGHTS
    # ------------------------------------------------------

    print()
    print("=== 16. INSIGHTS ===")

    response = client.get(
        "/api/v1/insights",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Endpoint de insights responde",
    )


    # ------------------------------------------------------
    # 21. REPORTES
    # ------------------------------------------------------

    print()
    print("=== 17. REPORTES ===")

    response = client.get(
        "/api/v1/reports",
        headers=admin_headers,
    )

    require_status(
        response,
        200,
        "Endpoint de reportes responde",
    )


    # ------------------------------------------------------
    # RESULTADO
    # ------------------------------------------------------

    success = True

    print()
    print("==============================================")
    print("FASE 05 - TODAS LAS PRUEBAS SUPERADAS")
    print("==============================================")
    print()
    print("[OK] FastAPI")
    print("[OK] OpenAPI")
    print("[OK] Servicios estadísticos")
    print("[OK] PostgreSQL")
    print("[OK] Autenticación")
    print("[OK] Autorización")
    print("[OK] Validación de entrada")
    print("[OK] Cliente")
    print("[OK] Categoría")
    print("[OK] Producto")
    print("[OK] Venta")
    print("[OK] Pago")
    print("[OK] Inventario")
    print("[OK] Persistencia")
    print("[OK] Dashboard")
    print("[OK] Insights")
    print("[OK] Reportes")
    print()
    print("FASE 05 = PRUEBA SUPERADA")

except Exception:
    print()
    print("==============================================")
    print("FASE 05 - ERROR DETECTADO")
    print("==============================================")
    traceback.print_exc()

finally:
    cleanup()


if success:
    sys.exit(0)

sys.exit(1)
