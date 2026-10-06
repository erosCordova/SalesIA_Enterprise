from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


def list_inventory_movements(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                m.id,
                m.inventory_id,
                m.product_id,

                p.sku,
                p.name AS product_name,

                m.user_id,

                COALESCE(
                    NULLIF(
                        TRIM(
                            CONCAT_WS(
                                ' ',
                                u.first_name,
                                u.last_name
                            )
                        ),
                        ''
                    ),
                    'Sistema'
                ) AS user_name,

                m.movement_type,
                m.quantity,

                m.reference_type,
                m.reference_id,

                CASE
                    WHEN LOWER(
                        COALESCE(
                            m.reference_type,
                            ''
                        )
                    ) = 'sale'
                    THEN COALESCE(
                        s.sale_number,
                        'Venta'
                    )

                    WHEN LOWER(
                        COALESCE(
                            m.reference_type,
                            ''
                        )
                    ) = 'manual'
                    THEN 'Movimiento manual'

                    WHEN LOWER(
                        COALESCE(
                            m.reference_type,
                            ''
                        )
                    ) = 'initial_stock'
                    THEN 'Stock inicial'

                    WHEN LOWER(
                        COALESCE(
                            m.reference_type,
                            ''
                        )
                    ) = 'sale_cancellation'
                    THEN 'Anulación de venta'

                    WHEN m.reference_type IS NULL
                    THEN NULL

                    ELSE INITCAP(
                        REPLACE(
                            m.reference_type,
                            '_',
                            ' '
                        )
                    )
                END AS reference_label,

                m.reason,
                m.movement_date

            FROM inventory_movements m

            INNER JOIN products p
                ON p.id = m.product_id
               AND p.company_id = m.company_id

            LEFT JOIN users u
                ON u.id = m.user_id
               AND u.company_id = m.company_id

            LEFT JOIN sales s
                ON s.id = m.reference_id
               AND LOWER(
                    COALESCE(
                        m.reference_type,
                        ''
                    )
               ) = 'sale'

            WHERE m.company_id = :company_id

            ORDER BY
                m.movement_date DESC,
                m.created_at DESC

            LIMIT 500
        """),
        {
            "company_id": company_id,
        },
    ).mappings().all()


def get_inventory_for_update(
    connection: Connection,
    company_id: UUID,
    product_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                i.id AS inventory_id,
                i.product_id,
                i.stock_quantity,

                p.sku,
                p.name AS product_name

            FROM inventory i

            INNER JOIN products p
                ON p.id = i.product_id
               AND p.company_id = i.company_id

            WHERE i.company_id = :company_id
              AND i.product_id = :product_id

            FOR UPDATE OF i
        """),
        {
            "company_id": company_id,
            "product_id": product_id,
        },
    ).mappings().first()


def update_inventory_stock(
    connection: Connection,
    inventory_id: UUID,
    new_stock,
):
    connection.execute(
        text("""
            UPDATE inventory
            SET
                stock_quantity = :new_stock,
                updated_at = NOW()
            WHERE id = :inventory_id
        """),
        {
            "inventory_id": inventory_id,
            "new_stock": new_stock,
        },
    )


def insert_manual_movement(
    connection: Connection,
    *,
    company_id: UUID,
    inventory_id: UUID,
    product_id: UUID,
    user_id: UUID,
    movement_type: str,
    quantity,
    reason: str,
):
    return connection.execute(
        text("""
            INSERT INTO inventory_movements (
                company_id,
                inventory_id,
                product_id,
                user_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                reason,
                movement_date
            )
            VALUES (
                :company_id,
                :inventory_id,
                :product_id,
                :user_id,
                :movement_type,
                :quantity,
                'manual',
                NULL,
                :reason,
                NOW()
            )
            RETURNING
                id,
                movement_date
        """),
        {
            "company_id": company_id,
            "inventory_id": inventory_id,
            "product_id": product_id,
            "user_id": user_id,
            "movement_type": movement_type,
            "quantity": quantity,
            "reason": reason,
        },
    ).mappings().one()
