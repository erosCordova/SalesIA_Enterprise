# SalesIA Enterprise
## FASE 04 - PostgreSQL

**Estado:** CERRADA  
**Entregable:** Modelo de datos, restricciones y migraciones

## 1. Motor
SalesIA Enterprise utiliza PostgreSQL.

## 2. Entidades principales
Seguridad: companies, roles, users, employees.

Gestión comercial: customers, categories, products, orders, order_details, sales, sale_details, payments.

Inventario: inventory, inventory_movements.

Analytics: datasets, dataset_variables, observations, statistical_analyses, statistical_results, bayes_analyses, random_variables, insights.

Reportes y auditoría: reports, audit_logs.

## 3. Integridad
La base utiliza claves primarias, claves foráneas, restricciones CHECK, nulabilidad e índices.

La auditoría previa registró 25 tablas totales incluyendo `alembic_version`, 47 claves foráneas, 44 constraints CHECK y 70 índices.

## 4. Restricciones verificadas
Ventas: estados `pending`, `completed`, `cancelled`, `refunded`.

Pagos: monto mayor que cero; métodos `cash`, `card`, `transfer`, `yape`, `plin`, `other`; estados `pending`, `completed`, `cancelled`, `refunded`.

Inventario: stock y mínimos no negativos; el máximo no puede ser menor que el mínimo.

Movimientos: cantidad mayor que cero; tipos `entry`, `exit`, `adjustment`, `return`. Para ventas se utiliza `exit`.

## 5. Transacciones
Una venta persiste cabecera, detalle, pago, descuento de stock y movimiento de inventario dentro de una transacción.

## 6. Migraciones
Alembic:
- Current: `9f2c7a4d8e11 (head)`
- Head: `9f2c7a4d8e11 (head)`

## 7. Evidencia funcional
La prueba de Fase 05 verificó venta, detalle, pago, stock de 10 a 8 al vender 2 unidades, movimiento `exit` y consulta posterior de la venta.

## 8. Criterios de aceptación
Existe esquema relacional, entidades operacionales y analíticas, relaciones, claves foráneas, constraints, índices, migraciones e integridad transaccional.

**FASE 04 = CERRADA**
