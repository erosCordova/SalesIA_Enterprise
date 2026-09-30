# SalesIA Enterprise
## FASE 02 - Arquitectura técnica

**Estado:** CERRADA  
**Entregable:** Documento de arquitectura y estructura técnica

## 1. Arquitectura general
Usuario -> React + TypeScript -> REST/HTTPS -> FastAPI -> Servicios -> Repositorios -> PostgreSQL.

## 2. Frontend
Tecnologías: React, TypeScript y Vite.

Responsabilidades: presentación, navegación, formularios, tablas, estados visuales, consumo de API y control visual de acceso.

## 3. Backend
Tecnologías: Python, FastAPI, Pydantic y SQLAlchemy.

Capas:
- `api/routes`: endpoints, parámetros, autenticación y autorización.
- `schemas`: contratos de entrada/salida y validación.
- `services`: lógica de negocio y transacciones.
- `repositories`: persistencia y consultas.
- `models`: entidades de datos.

## 4. PostgreSQL
Responsabilidades: persistencia operacional, integridad referencial, relaciones, restricciones, índices, datos analíticos y auditoría.

Las migraciones se gestionan mediante Alembic.

## 5. Dominios de API
Auth, Users, Customers, Categories, Products, Sales, Inventory, Dashboard, Statistics, Probability, Insights, Reports y Audit.

## 6. Autenticación y autorización
El inicio de sesión utiliza DNI y contraseña. Los endpoints protegidos utilizan token Bearer y control por rol.

Roles: Administrador, Gerente, Vendedor, Analista y Almacén.

La gestión de usuarios queda restringida al Administrador.

## 7. Contratos REST principales
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET/POST /api/v1/customers`
- `GET/POST /api/v1/categories`
- `GET/POST /api/v1/products`
- `GET/POST /api/v1/sales`
- `GET /api/v1/inventory`
- `GET /api/v1/dashboard/summary`
- `POST /api/v1/statistics/mean`
- `POST /api/v1/statistics/median`
- `POST /api/v1/statistics/compare`
- `POST /api/v1/probability/bayes`
- `POST /api/v1/random-variables/analyze`
- `GET /api/v1/insights`
- `GET /api/v1/reports`

## 8. Validación y errores
Las solicitudes se validan antes de ejecutar la lógica de negocio. `payment_method` acepta `cash`, `card`, `transfer`, `yape`, `plin` y `other`; valores fuera del contrato son rechazados antes de llegar a PostgreSQL.

## 9. Configuración y migraciones
Los secretos se gestionan mediante variables de entorno y los `.env` reales no se versionan.

Alembic verificado:
- Current: `9f2c7a4d8e11 (head)`
- Head: `9f2c7a4d8e11 (head)`

## 10. Criterios de aceptación
Existe separación frontend/API/base de datos, módulos por dominio, schemas, servicios, repositorios, autenticación, autorización, migraciones, ambientes y contratos REST.

**FASE 02 = CERRADA**
