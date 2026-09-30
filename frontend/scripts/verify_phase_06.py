from __future__ import annotations

import compileall
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

sys.path.insert(
    0,
    str(BACKEND),
)


errors: list[str] = []


def section(title: str) -> None:
    print()
    print("=" * 62)
    print(title)
    print("=" * 62)


def ok(message: str) -> None:
    print(
        f"[OK] {message}"
    )


def fail(message: str) -> None:
    print(
        f"[ERROR] {message}"
    )
    errors.append(message)


def require_file(
    relative: str,
) -> Path | None:
    path = ROOT / relative

    if path.is_file():
        ok(relative)
        return path

    fail(
        f"Falta archivo: {relative}"
    )
    return None


def require_text(
    relative: str,
    tokens: list[str],
) -> None:
    path = ROOT / relative

    if not path.is_file():
        fail(
            f"Falta archivo: {relative}"
        )
        return

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    missing = [
        token
        for token in tokens
        if token not in text
    ]

    if missing:
        fail(
            f"{relative}: faltan "
            + ", ".join(missing)
        )
    else:
        ok(
            f"{relative} integrado"
        )


# ============================================================
# 1. ARQUITECTURA FRONTEND
# ============================================================

section(
    "1. ARQUITECTURA FRONTEND"
)

required_files = [
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

for relative in required_files:
    require_file(relative)


# ============================================================
# 2. AUTENTICACION Y PROTECCION
# ============================================================

section(
    "2. AUTENTICACION Y SESION"
)

require_text(
    "frontend/src/services/auth.service.ts",
    [
        "/auth/login",
        "/auth/me",
    ],
)

require_text(
    "frontend/src/services/auth.context.tsx",
    [
        "localStorage",
    ],
)

router_path = (
    ROOT
    / "frontend/src/app/router/AppRouter.tsx"
)

if router_path.is_file():
    router_text = router_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    protected_tokens = [
        "ProtectedRoute",
        "dashboard",
    ]

    missing = [
        token
        for token in protected_tokens
        if token not in router_text
    ]

    if missing:
        fail(
            "Router no contiene protección "
            "esperada: "
            + ", ".join(missing)
        )
    else:
        ok(
            "Router centralizado y protegido"
        )
else:
    fail(
        "No existe AppRouter.tsx"
    )


# ============================================================
# 3. MODULOS FUNCIONALES
# ============================================================

section(
    "3. MODULOS FASE 06"
)

module_files = {
    "Dashboard":
        "frontend/src/modules/dashboard/DashboardPage.tsx",

    "Ventas":
        "frontend/src/modules/ventas/VentasPage.tsx",

    "Nueva venta":
        "frontend/src/modules/ventas/NuevaVentaPage.tsx",

    "Productos":
        "frontend/src/modules/productos/ProductosPage.tsx",

    "Inventario":
        "frontend/src/modules/inventario/InventarioPage.tsx",

    "Clientes":
        "frontend/src/modules/commercial/CommercialPage.tsx",

    "Categorias":
        "frontend/src/modules/categorias/CategoriasPage.tsx",

    "Analytics":
        "frontend/src/modules/analytics/AnalyticsPage.tsx",

    "Reportes":
        "frontend/src/modules/reports/ReportsPage.tsx",

    "Insights":
        "frontend/src/modules/insights/InsightsPage.tsx",

    "Probabilidad":
        "frontend/src/modules/probabilidad/ProbabilidadPage.tsx",

    "Auditoria":
        "frontend/src/modules/audit/AuditPage.tsx",

    "Empresa":
        "frontend/src/modules/empresa/EmpresaPage.tsx",

    "Sucursales":
        "frontend/src/modules/sucursales/SucursalesPage.tsx",
}

for name, relative in module_files.items():
    path = ROOT / relative

    if not path.is_file():
        fail(
            f"{name}: archivo inexistente"
        )
        continue

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    if (
        name in {
            "Empresa",
            "Sucursales",
            "Ventas",
            "Nueva venta",
            "Productos",
            "Inventario",
            "Categorias",
            "Analytics",
            "Reportes",
            "Insights",
            "Probabilidad",
            "Auditoria",
        }
        and "ModulePage" in text
    ):
        fail(
            f"{name}: todavía usa ModulePage"
        )
    else:
        ok(
            f"{name}: módulo implementado"
        )


# ============================================================
# 4. SERVICIOS FRONTEND
# ============================================================

section(
    "4. SERVICIOS FRONTEND"
)

services = [
    "frontend/src/services/api.ts",
    "frontend/src/services/auth.service.ts",
    "frontend/src/services/commercial.service.ts",
    "frontend/src/services/analytics.service.ts",
    "frontend/src/services/reporting.service.ts",
    "frontend/src/services/organization.service.ts",
]

for relative in services:
    require_file(relative)


require_text(
    "frontend/src/services/organization.service.ts",
    [
        "/company",
        "/branches",
    ],
)


# ============================================================
# 5. BACKEND PYTHON
# ============================================================

section(
    "5. BACKEND"
)

compiled = compileall.compile_dir(
    str(BACKEND / "app"),
    quiet=1,
)

if compiled:
    ok(
        "Backend compila correctamente"
    )
else:
    fail(
        "Backend contiene errores de compilación"
    )


# ============================================================
# 6. OPENAPI
# ============================================================

section(
    "6. OPENAPI"
)

try:
    from app.main import app

    paths = app.openapi().get(
        "paths",
        {},
    )

    required_paths = [
        "/api/v1/auth/login",
        "/api/v1/auth/me",
        "/api/v1/users",
        "/api/v1/customers",
        "/api/v1/categories",
        "/api/v1/products",
        "/api/v1/sales",
        "/api/v1/inventory",
        "/api/v1/dashboard/summary",
        "/api/v1/analytics/status",
        "/api/v1/statistics/mean",
        "/api/v1/statistics/median",
        "/api/v1/statistics/compare",
        "/api/v1/probability/bayes",
        "/api/v1/random-variables/analyze",
        "/api/v1/insights",
        "/api/v1/reports",
        "/api/v1/audit/status",
        "/api/v1/company",
        "/api/v1/branches",
        "/api/v1/branches/{branch_id}",
    ]

    for path in required_paths:
        if path in paths:
            ok(
                f"OpenAPI: {path}"
            )
        else:
            fail(
                f"OpenAPI: falta {path}"
            )

except Exception as exc:
    fail(
        "No se pudo cargar FastAPI/OpenAPI: "
        f"{type(exc).__name__}: {exc}"
    )


# ============================================================
# 7. POSTGRESQL EMPRESA / SUCURSALES
# ============================================================

section(
    "7. POSTGRESQL ORGANIZACIONAL"
)

try:
    from sqlalchemy import create_engine, text

    from app.core.database import engine

    verification_engine = create_engine(
        engine.url,
        pool_pre_ping=True,
        connect_args={
            "connect_timeout": 10,
        },
    )

    with verification_engine.connect() as connection:
        connection.execute(
            text(
                "SET statement_timeout = '10000ms'"
            )
        )

        tables = set(
            connection.execute(
                text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                """)
            ).scalars().all()
        )

        for table in (
            "companies",
            "branches",
        ):
            if table in tables:
                ok(
                    f"Tabla {table}"
                )
            else:
                fail(
                    f"Falta tabla {table}"
                )

        if "branches" in tables:

            fk_count = connection.execute(
                text("""
                    SELECT COUNT(*)
                    FROM pg_constraint c
                    INNER JOIN pg_class t
                        ON t.oid = c.conrelid
                    INNER JOIN pg_namespace n
                        ON n.oid = t.relnamespace
                    WHERE n.nspname = 'public'
                      AND t.relname = 'branches'
                      AND c.contype = 'f'
                """)
            ).scalar_one()

            if fk_count >= 1:
                ok(
                    "branches vinculada mediante FK"
                )
            else:
                fail(
                    "branches no tiene FK"
                )

            company_fk = connection.execute(
                text("""
                    SELECT COUNT(*)
                    FROM information_schema.table_constraints tc
                    INNER JOIN
                        information_schema.key_column_usage kcu
                        ON tc.constraint_name =
                           kcu.constraint_name
                       AND tc.constraint_schema =
                           kcu.constraint_schema
                    INNER JOIN
                        information_schema.constraint_column_usage ccu
                        ON ccu.constraint_name =
                           tc.constraint_name
                       AND ccu.constraint_schema =
                           tc.constraint_schema
                    WHERE tc.constraint_type =
                          'FOREIGN KEY'
                      AND tc.table_schema =
                          'public'
                      AND tc.table_name =
                          'branches'
                      AND kcu.column_name =
                          'company_id'
                      AND ccu.table_name =
                          'companies'
                      AND ccu.column_name =
                          'id'
                """)
            ).scalar_one()

            if company_fk == 1:
                ok(
                    "branches.company_id -> companies.id"
                )
            else:
                fail(
                    "Relación branches/company incorrecta"
                )

except Exception as exc:
    fail(
        "Error PostgreSQL: "
        f"{type(exc).__name__}: {exc}"
    )


# ============================================================
# 8. BUILD FRONTEND
# ============================================================

section(
    "8. BUILD FRONTEND"
)

try:
    result = subprocess.run(
        [
            "npm",
            "run",
            "build",
        ],
        cwd=FRONTEND,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
    )

    print(
        result.stdout
    )

    if result.returncode == 0:
        ok(
            "Frontend compila para producción"
        )
    else:
        fail(
            "npm run build falló"
        )

except Exception as exc:
    fail(
        "No se pudo ejecutar npm build: "
        f"{type(exc).__name__}: {exc}"
    )


# ============================================================
# 9. RESULTADO
# ============================================================

section(
    "RESULTADO FINAL FASE 06"
)

if errors:
    print(
        f"ERRORES={len(errors)}"
    )

    for index, error in enumerate(
        errors,
        start=1,
    ):
        print(
            f"{index}. {error}"
        )

    print()
    print(
        "FASE 06 = AUN NO CERRADA"
    )

    sys.exit(1)


print(
    "[OK] Arquitectura frontend"
)
print(
    "[OK] Autenticación y sesión"
)
print(
    "[OK] Router y rutas protegidas"
)
print(
    "[OK] Dashboard"
)
print(
    "[OK] Ventas"
)
print(
    "[OK] Productos"
)
print(
    "[OK] Inventario"
)
print(
    "[OK] Clientes"
)
print(
    "[OK] Categorías"
)
print(
    "[OK] Analytics"
)
print(
    "[OK] Reportes"
)
print(
    "[OK] Insights"
)
print(
    "[OK] Probabilidad"
)
print(
    "[OK] Auditoría"
)
print(
    "[OK] Empresa"
)
print(
    "[OK] Sucursales"
)
print(
    "[OK] Backend"
)
print(
    "[OK] PostgreSQL"
)
print(
    "[OK] OpenAPI"
)
print(
    "[OK] Build frontend"
)

print()
print(
    "=============================================="
)
print(
    "FASE 06 = PRUEBA SUPERADA"
)
print(
    "=============================================="
)
