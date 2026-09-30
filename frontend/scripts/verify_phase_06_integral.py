from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
SRC = FRONTEND / "src"

errors = []
warnings = []
passed = []


def ok(message):
    passed.append(message)
    print(f"[OK] {message}")


def fail(message):
    errors.append(message)
    print(f"[ERROR] {message}")


def warn(message):
    warnings.append(message)
    print(f"[WARN] {message}")


def read(relative_path):
    path = ROOT / relative_path

    if not path.is_file():
        fail(f"Falta archivo: {relative_path}")
        return ""

    try:
        return path.read_text(
            encoding="utf-8"
        )
    except UnicodeDecodeError:
        return path.read_text(
            encoding="utf-8",
            errors="replace",
        )


def require_file(relative_path):
    path = ROOT / relative_path

    if path.is_file():
        ok(f"Archivo presente: {relative_path}")
        return True

    fail(f"Falta archivo: {relative_path}")
    return False


def require_text(
    relative_path,
    text,
    description,
):
    content = read(relative_path)

    if text in content:
        ok(description)
        return True

    fail(
        f"{description} "
        f"(no se encontró {text!r} en {relative_path})"
    )
    return False


def require_any_text(
    relative_path,
    values,
    description,
):
    content = read(relative_path)

    if any(
        value in content
        for value in values
    ):
        ok(description)
        return True

    fail(
        f"{description} "
        f"(ninguna variante encontrada en {relative_path})"
    )
    return False


def forbid_text(
    relative_path,
    text,
    description,
):
    content = read(relative_path)

    if text not in content:
        ok(description)
        return True

    fail(
        f"{description} "
        f"(se encontró {text!r} en {relative_path})"
    )
    return False


def section(title):
    print()
    print("=" * 54)
    print(title)
    print("=" * 54)


section("1. ESTRUCTURA BASE FRONTEND")

base_files = [
    "frontend/package.json",
    "frontend/src/main.tsx",
    "frontend/src/App.tsx",
    "frontend/src/app/App.tsx",
    "frontend/src/app/providers.tsx",
    "frontend/src/app/router/AppRouter.tsx",
    "frontend/src/layouts/MainLayout.tsx",
    "frontend/src/components/Sidebar.tsx",
    "frontend/src/components/Topbar.tsx",
    "frontend/src/services/api.ts",
    "frontend/src/services/auth.service.ts",
    "frontend/src/services/auth.context.tsx",
    "frontend/src/types/auth.ts",
]

for file in base_files:
    require_file(file)


section("2. AUTENTICACION Y SESION")

require_any_text(
    "frontend/src/services/auth.context.tsx",
    [
        "AuthProvider",
        "AuthContext",
    ],
    "Contexto global de autenticación presente",
)

require_text(
    "frontend/src/services/auth.service.ts",
    "/auth/login",
    "Login conectado a /auth/login",
)

require_text(
    "frontend/src/services/auth.service.ts",
    "/auth/me",
    "Validación de sesión conectada a /auth/me",
)

require_text(
    "frontend/src/services/api.ts",
    "access_token",
    "API utiliza token almacenado",
)

require_text(
    "frontend/src/services/api.ts",
    "Authorization",
    "API envía Authorization",
)

require_any_text(
    "frontend/src/app/router/AppRouter.tsx",
    [
        "ProtectedRoute",
        "RequireAuth",
        "AuthRoute",
    ],
    "Protección de rutas presente",
)

require_any_text(
    "frontend/src/app/router/AppRouter.tsx",
    [
        "RoleRoute",
        "RequireRole",
        "allowed",
    ],
    "Control de rutas por roles presente",
)


section("3. CAPA DE INTEGRACION")

integration_files = [
    "frontend/src/types/commercial.ts",
    "frontend/src/types/analytics.ts",
    "frontend/src/types/reporting.ts",
    "frontend/src/services/commercial.service.ts",
    "frontend/src/services/analytics.service.ts",
    "frontend/src/services/reporting.service.ts",
    "frontend/src/hooks/useApiResource.ts",
]

for file in integration_files:
    require_file(file)


section("4. ENDPOINTS COMERCIALES")

commercial_endpoints = [
    "/customers",
    "/categories",
    "/products",
    "/inventory",
    "/sales",
]

commercial_content = read(
    "frontend/src/services/commercial.service.ts"
)

for endpoint in commercial_endpoints:
    if endpoint in commercial_content:
        ok(f"Endpoint comercial configurado: {endpoint}")
    else:
        fail(f"Falta endpoint comercial: {endpoint}")


section("5. ENDPOINTS ANALYTICOS")

analytics_endpoints = [
    "/statistics/compare",
    "/probability/bayes",
    "/random-variables/analyze",
]

analytics_content = read(
    "frontend/src/services/analytics.service.ts"
)

for endpoint in analytics_endpoints:
    if endpoint in analytics_content:
        ok(f"Endpoint analítico configurado: {endpoint}")
    else:
        fail(f"Falta endpoint analítico: {endpoint}")


section("6. INSIGHTS / REPORTES / AUDITORIA")

reporting_content = read(
    "frontend/src/services/reporting.service.ts"
)

reporting_endpoints = [
    "/insights",
    "/reports",
    "/audit/status",
]

for endpoint in reporting_endpoints:
    if endpoint in reporting_content:
        ok(f"Endpoint reporting configurado: {endpoint}")
    else:
        fail(f"Falta endpoint reporting: {endpoint}")

if "/reports/status" in reporting_content:
    ok("Estado del módulo de reportes configurado")
else:
    warn(
        "No se encontró /reports/status en reporting.service.ts"
    )


section("7. PAGINAS FUNCIONALES")

page_groups = {
    "Clientes": [
        "frontend/src/modules/commercial/CommercialPage.tsx",
    ],
    "Categorias": [
        "frontend/src/modules/categorias/CategoriasPage.tsx",
    ],
    "Productos": [
        "frontend/src/modules/productos/ProductosPage.tsx",
    ],
    "Inventario": [
        "frontend/src/modules/inventory/InventoryPage.tsx",
    ],
    "Ventas": [
        "frontend/src/modules/ventas/VentasPage.tsx",
    ],
    "Nueva venta": [
        "frontend/src/modules/ventas/NuevaVentaPage.tsx",
    ],
    "Analytics": [
        "frontend/src/modules/analytics/AnalyticsPage.tsx",
    ],
    "Probabilidad": [
        "frontend/src/modules/probabilidad/ProbabilidadPage.tsx",
    ],
    "Insights": [
        "frontend/src/modules/insights/InsightsPage.tsx",
    ],
    "Reportes": [
        "frontend/src/modules/reports/ReportsPage.tsx",
    ],
    "Auditoria": [
        "frontend/src/modules/audit/AuditPage.tsx",
    ],
}

existing_pages = {}

for name, candidates in page_groups.items():
    found = None

    for candidate in candidates:
        if (ROOT / candidate).is_file():
            found = candidate
            break

    if found:
        existing_pages[name] = found
        ok(f"Página funcional presente: {name}")
    else:
        fail(f"Falta página funcional: {name}")


section("8. DETECCION DE PLACEHOLDERS")

functional_modules = [
    "Clientes",
    "Categorias",
    "Productos",
    "Inventario",
    "Ventas",
    "Nueva venta",
    "Analytics",
    "Probabilidad",
    "Insights",
    "Reportes",
    "Auditoria",
]

for name in functional_modules:
    path = existing_pages.get(name)

    if not path:
        continue

    content = read(path)

    if "ModulePage" in content:
        fail(
            f"{name} todavía usa ModulePage como placeholder: "
            f"{path}"
        )
    else:
        ok(f"{name} ya no usa ModulePage")


section("9. CONEXION DE PAGINAS AL BACKEND")

backend_connections = {
    "Clientes": [
        "getCustomers",
        "createCustomer",
    ],
    "Categorias": [
        "getCategories",
        "createCategory",
    ],
    "Productos": [
        "getProducts",
        "createProduct",
    ],
    "Inventario": [
        "getInventory",
    ],
    "Ventas": [
        "getSales",
    ],
    "Nueva venta": [
        "createSale",
    ],
    "Analytics": [
        "compareStatistics",
    ],
    "Probabilidad": [
        "calculateBayes",
        "analyzeRandomVariable",
    ],
    "Insights": [
        "getInsights",
    ],
    "Reportes": [
        "getReports",
    ],
    "Auditoria": [
        "getAuditStatus",
    ],
}

for name, expected_symbols in backend_connections.items():
    path = existing_pages.get(name)

    if not path:
        continue

    content = read(path)

    found_symbols = [
        symbol
        for symbol in expected_symbols
        if symbol in content
    ]

    if found_symbols:
        ok(
            f"{name} conectado al backend "
            f"({', '.join(found_symbols)})"
        )
    else:
        fail(
            f"{name} no muestra conexión esperada al backend. "
            f"Se esperaba alguno de: "
            f"{', '.join(expected_symbols)}"
        )


section("10. RUTAS PRINCIPALES")

router = read(
    "frontend/src/app/router/AppRouter.tsx"
)

routes = [
    "/dashboard",
    "/commercial",
    "/categories",
    "/products",
    "/inventory",
    "/sales",
    "/sales/new",
    "/analytics",
    "/probability",
    "/insights",
    "/reports",
    "/audit",
]

for route in routes:
    patterns = [
        f'path="{route}"',
        f"path='{route}'",
    ]

    if any(
        pattern in router
        for pattern in patterns
    ):
        ok(f"Ruta registrada: {route}")
    else:
        fail(f"Falta ruta frontend: {route}")


section("11. SIDEBAR Y NAVEGACION")

sidebar = read(
    "frontend/src/components/Sidebar.tsx"
)

navigation_paths = [
    "/dashboard",
    "/commercial",
    "/products",
    "/inventory",
    "/sales",
    "/analytics",
    "/insights",
    "/reports",
]

for route in navigation_paths:
    if route in sidebar:
        ok(f"Sidebar contiene navegación: {route}")
    else:
        fail(f"Sidebar no contiene navegación: {route}")

if "/audit" in sidebar:
    ok("Sidebar contiene Auditoría")
else:
    fail("Sidebar no contiene Auditoría")


section("12. DETECCION DE DATOS DEMO")

demo_patterns = [
    "initialCustomers",
    "initialProducts",
    "mockCustomers",
    "mockProducts",
    "mockSales",
    "fakeCustomers",
    "fakeProducts",
]

demo_found = []

for name, path in existing_pages.items():
    content = read(path)

    for pattern in demo_patterns:
        if pattern in content:
            demo_found.append(
                f"{name}: {pattern}"
            )

if demo_found:
    for item in demo_found:
        fail(
            f"Datos demo detectados en módulo funcional: {item}"
        )
else:
    ok("No se detectaron colecciones demo conocidas")


section("13. BACKEND - ARCHIVOS Y ROUTER")

backend_files = [
    "backend/app/main.py",
    "backend/app/api/router.py",
    "backend/app/api/routes/customers.py",
    "backend/app/api/routes/categories.py",
    "backend/app/api/routes/products.py",
    "backend/app/api/routes/sales.py",
    "backend/app/api/routes/inventory.py",
    "backend/app/api/routes/dashboard.py",
    "backend/app/api/routes/insights.py",
    "backend/app/api/routes/reports.py",
    "backend/app/api/routes/audit.py",
]

for file in backend_files:
    require_file(file)

backend_router = read(
    "backend/app/api/router.py"
)

backend_prefixes = [
    'prefix="/auth"',
    'prefix="/customers"',
    'prefix="/categories"',
    'prefix="/products"',
    'prefix="/sales"',
    'prefix="/inventory"',
    'prefix="/dashboard"',
    'prefix="/analytics"',
    'prefix="/statistics"',
    'prefix="/probability"',
    'prefix="/random-variables"',
    'prefix="/insights"',
    'prefix="/reports"',
    'prefix="/audit"',
]

for prefix in backend_prefixes:
    if prefix in backend_router:
        ok(f"Router backend registrado: {prefix}")
    else:
        fail(f"Router backend faltante: {prefix}")


section("14. COMPILACION BACKEND")

backend_python = (
    ROOT
    / "backend"
    / ".venv"
    / "Scripts"
    / "python.exe"
)

if backend_python.is_file():
    command = [
        str(backend_python),
        "-m",
        "compileall",
        "-q",
        "app",
    ]
else:
    command = [
        sys.executable,
        "-m",
        "compileall",
        "-q",
        "app",
    ]

try:
    result = subprocess.run(
        command,
        cwd=ROOT / "backend",
        check=False,
    )

    if result.returncode == 0:
        ok("Backend Python compila correctamente")
    else:
        fail(
            "Backend Python tiene errores de compilación"
        )
except Exception as exc:
    fail(
        f"No se pudo compilar backend: {exc}"
    )


section("15. COMPILACION FRONTEND")

npm_command = (
    "npm.cmd"
    if sys.platform.startswith("win")
    else "npm"
)

try:
    result = subprocess.run(
        [
            npm_command,
            "run",
            "build",
        ],
        cwd=FRONTEND,
        check=False,
    )

    if result.returncode == 0:
        ok("Frontend TypeScript/Vite compila correctamente")
    else:
        fail(
            "Frontend tiene errores de compilación"
        )
except FileNotFoundError:
    fail(
        "No se encontró npm en PATH"
    )
except Exception as exc:
    fail(
        f"No se pudo compilar frontend: {exc}"
    )


section("16. RESUMEN")

print(f"Pruebas OK: {len(passed)}")
print(f"Warnings: {len(warnings)}")
print(f"Errores: {len(errors)}")

if warnings:
    print()
    print("WARNINGS:")

    for item in warnings:
        print(f"  - {item}")

if errors:
    print()
    print("ERRORES ENCONTRADOS:")

    for item in errors:
        print(f"  - {item}")

    print()
    print("=" * 54)
    print("CODIGO 9 = NO SUPERADO")
    print("=" * 54)

    sys.exit(1)

print()
print("=" * 54)
print("CODIGO 9 = SUPERADO")
print("=" * 54)
print()
print(
    "La estructura de Fase 06 está preparada "
    "para la prueba funcional final."
)

sys.exit(0)
