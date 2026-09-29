from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine


EXPECTED_TABLES = {
    "audit_logs",
    "bayes_analyses",
    "categories",
    "companies",
    "customers",
    "dataset_variables",
    "datasets",
    "employees",
    "insights",
    "inventory",
    "inventory_movements",
    "observations",
    "order_details",
    "orders",
    "payments",
    "products",
    "random_variables",
    "reports",
    "roles",
    "sale_details",
    "sales",
    "statistical_analyses",
    "statistical_results",
    "users",
}


def main():
    print("=" * 60)
    print("SalesIA Enterprise - Comprobación de base de datos")
    print("=" * 60)

    try:
        with engine.connect() as connection:
            database = connection.execute(
                text("SELECT current_database()")
            ).scalar()

            user = connection.execute(
                text("SELECT current_user")
            ).scalar()

            version = connection.execute(
                text("SELECT version()")
            ).scalar()

            inspector = inspect(connection)

            tables = set(
                inspector.get_table_names(schema="public")
            )

            print("\n[OK] Conexión establecida")
            print(f"Base de datos : {database}")
            print(f"Usuario       : {user}")
            print(f"PostgreSQL    : {version.split(',')[0]}")

            print("\n--- TABLAS ---")
            print(f"Encontradas   : {len(tables)}")
            print(f"Esperadas     : {len(EXPECTED_TABLES)}")

            missing = EXPECTED_TABLES - tables
            extra = tables - EXPECTED_TABLES

            for table in sorted(EXPECTED_TABLES):
                status = "OK" if table in tables else "FALTA"
                print(f"{table:<25} {status}")

            if missing:
                print("\n[ADVERTENCIA] Tablas faltantes:")
                for table in sorted(missing):
                    print(f" - {table}")

            if extra:
                print("\nTablas adicionales:")
                for table in sorted(extra):
                    print(f" + {table}")

            if not missing:
                print(
                    "\n[OK] Las 24 tablas principales de SalesIA "
                    "están disponibles."
                )

    except SQLAlchemyError as error:
        print("\n[ERROR] No se pudo conectar a la base de datos.")
        print()
        print(type(error).__name__)

        original = getattr(error, "orig", None)

        if original:
            print(str(original))
        else:
            print(str(error))

        print(
            "\nRevisa DATABASE_URL en backend/.env. "
            "No necesitas mostrar ni compartir tu contraseña."
        )


if __name__ == "__main__":
    main()
