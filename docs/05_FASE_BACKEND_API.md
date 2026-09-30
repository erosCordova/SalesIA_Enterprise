# SalesIA Enterprise
## FASE 05 - Backend / API

**Estado:** CERRADA  
**Entregable:** API FastAPI documentada

## 1. Framework
El backend utiliza Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL y Alembic.

## 2. Organización
Estructura principal:
- `app/api`
- `app/core`
- `app/models`
- `app/schemas`
- `app/services`
- `app/repositories`
- `app/statistics`
- `app/probability`

## 3. Flujo
Cliente HTTP -> FastAPI Route -> Schema/Validación -> Service -> Repository -> PostgreSQL.

## 4. Autenticación
Endpoints:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

El usuario inicia sesión con DNI y contraseña y recibe token Bearer cuando las credenciales son válidas.

## 5. Autorización
La API aplica autorización por rol. La prueba funcional confirmó que el Administrador puede gestionar usuarios y que un Vendedor recibe 403 al intentar administrar usuarios.

## 6. Validación
`payment_method` acepta `cash`, `card`, `transfer`, `yape`, `plin` y `other`. Valores como `Efectivo` son rechazados por FastAPI antes de llegar a PostgreSQL.

## 7. Venta transaccional
El servicio valida cliente, productos, estado y stock; calcula subtotal, descuentos, impuesto y total; inserta venta y detalles; descuenta stock; registra movimiento `exit`; registra pago.

## 8. Servicios estadísticos disponibles
La auditoría confirmó:
- `calculate_mean`
- `calculate_median`
- `compare_statistics`
- `calculate_bayes`
- `analyze_random_variable`

La implementación completa del motor estadístico corresponde a la Fase 09.

## 9. OpenAPI
La auditoría confirmó importación correcta de `app.main`, 30 operaciones HTTP y API requerida completa.

## 10. Evidencia funcional
Archivo: `docs/evidencias/FASE_05_VERIFICACION_FINAL.txt`

Resultado final: `FASE 05 = PRUEBA SUPERADA`.

La prueba confirmó FastAPI, OpenAPI, servicios estadísticos, PostgreSQL, autenticación, autorización, validación, cliente, categoría, producto, venta, pago, inventario, persistencia, dashboard, insights y reportes.

## 11. Migraciones
- Current: `9f2c7a4d8e11 (head)`
- Head: `9f2c7a4d8e11 (head)`

## 12. Criterios de aceptación
Existe aplicación FastAPI, módulos por dominio, autenticación, autorización, validación, servicios, repositorios, transacciones, OpenAPI, endpoints requeridos y prueba integral superada.

**FASE 05 = CERRADA**
