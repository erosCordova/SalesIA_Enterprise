# SalesIA Enterprise
## FASE 01 - Análisis y levantamiento

**Estado:** CERRADA  
**Entregable:** Documento de requisitos y casos de uso

## 1. Problema
SalesIA Enterprise integra la gestión comercial con el análisis de datos. El sistema debe registrar clientes, productos, pedidos, ventas, pagos e inventario, y preparar esos datos para análisis posteriores.

## 2. Objetivo general
Diseñar y desarrollar un sistema web empresarial de gestión de ventas con arquitectura modular, capaz de registrar operaciones comerciales en PostgreSQL y preparar esos datos para análisis estadístico mediante Python.

## 3. Alcance
Dominios principales:
- Acceso y seguridad.
- Gestión comercial.
- Inventario.
- Dashboard ejecutivo.
- Analytics.
- Reportes.
- Auditoría y trazabilidad.

Clientes, productos, categorías, ventas y pagos son entidades y funcionalidades del dominio comercial.

## 4. Actores y roles
- **Administrador:** configura el sistema, gestiona usuarios, roles y parámetros.
- **Gerente:** consulta indicadores, Analytics, reportes y resultados comerciales.
- **Vendedor:** registra clientes, pedidos y ventas autorizadas.
- **Analista:** ejecuta análisis estadísticos y genera insights/reportes.
- **Almacén:** gestiona stock y movimientos de inventario.

## 5. Flujo principal
Cliente -> Pedido -> Venta -> Pago -> Actualización de inventario -> PostgreSQL -> Dataset analítico -> Estadística/Probabilidad -> Insights -> Dashboard/Reportes.

## 6. Casos de uso principales
- CU-01: iniciar sesión con DNI y contraseña.
- CU-02: gestionar usuarios; solo el Administrador crea usuarios y asigna roles.
- CU-03: registrar y consultar clientes.
- CU-04: registrar productos, categorías, precios y stock inicial.
- CU-05: registrar una venta validando cliente, productos, stock, importes, pago e inventario dentro de una transacción.
- CU-06: consultar inventario y movimientos.
- CU-07: consultar dashboard.
- CU-08: ejecutar servicios estadísticos y de probabilidad.
- CU-09: consultar insights y reportes.

## 7. Reglas de negocio
- Solo usuarios activos pueden operar.
- El acceso depende del rol.
- Solo el Administrador administra usuarios.
- El login utiliza DNI y contraseña.
- No se venden productos inexistentes o inactivos.
- No se vende más stock del disponible.
- Las cantidades deben ser mayores que cero.
- Los importes no pueden ser negativos.
- Una venta actualiza inventario dentro de la misma transacción.
- La salida por venta usa `movement_type = exit`.
- Métodos de pago internos: `cash`, `card`, `transfer`, `yape`, `plin`, `other`.

## 8. Requisitos
Requisitos funcionales: autenticación, usuarios, clientes, productos/categorías, vendedores, ventas, pagos, inventario, dashboard, datos analíticos, media, mediana, variables, probabilidad, Bayes, gráficos, insights, reportes, historial y auditoría.

Requisitos no funcionales: arquitectura modular, validación, integridad referencial, autenticación y autorización, API documentada, diseño responsive, trazabilidad, separación de capas, pruebas, variables de entorno, manejo centralizado de errores y rendimiento adecuado.

## 9. Criterios de aceptación
Quedan definidos problema, objetivo, alcance, actores, flujo comercial, datos, casos de uso, reglas de negocio y requisitos.

**FASE 01 = CERRADA**
