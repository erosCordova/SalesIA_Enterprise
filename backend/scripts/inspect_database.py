from sqlalchemy import text

from app.core.database import engine


def main():
    print("=" * 75)
    print("SalesIA Enterprise - Relaciones e índices de Supabase")
    print("=" * 75)

    with engine.connect() as connection:

        # =====================================================
        # FOREIGN KEYS
        # =====================================================

        foreign_keys_query = text("""
            SELECT
                tc.table_name AS tabla,
                kcu.column_name AS columna,
                ccu.table_name AS tabla_referenciada,
                ccu.column_name AS columna_referenciada
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.constraint_schema = kcu.constraint_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON tc.constraint_name = ccu.constraint_name
                AND tc.constraint_schema = ccu.constraint_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
        """)

        foreign_keys = connection.execute(
            foreign_keys_query
        ).mappings().all()

        print("\nFOREIGN KEYS")
        print("-" * 75)

        if not foreign_keys:
            print("No se encontraron relaciones.")
        else:
            for fk in foreign_keys:
                print(
                    f"{fk['tabla']}.{fk['columna']} "
                    f"-> "
                    f"{fk['tabla_referenciada']}."
                    f"{fk['columna_referenciada']}"
                )

        # =====================================================
        # PRIMARY KEYS
        # =====================================================

        primary_keys_query = text("""
            SELECT
                tc.table_name AS tabla,
                kcu.column_name AS columna
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.ordinal_position;
        """)

        primary_keys = connection.execute(
            primary_keys_query
        ).mappings().all()

        print("\nPRIMARY KEYS")
        print("-" * 75)

        for pk in primary_keys:
            print(
                f"{pk['tabla']}.{pk['columna']}"
            )

        # =====================================================
        # ÍNDICES
        # =====================================================

        indexes_query = text("""
            SELECT
                tablename AS tabla,
                indexname AS indice
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
        """)

        indexes = connection.execute(
            indexes_query
        ).mappings().all()

        print("\nÍNDICES")
        print("-" * 75)

        for index in indexes:
            print(
                f"{index['tabla']} -> "
                f"{index['indice']}"
            )

        print("\n" + "=" * 75)
        print(f"Foreign Keys encontradas : {len(foreign_keys)}")
        print(f"Primary Keys encontradas : {len(primary_keys)}")
        print(f"Índices encontrados      : {len(indexes)}")
        print("[OK] Revisión terminada.")
        print("=" * 75)


if __name__ == "__main__":
    main()
