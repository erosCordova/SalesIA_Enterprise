# Registro de avance — Fase 14: Pruebas y calidad — FINALIZADA

Esta fase corresponde a **Pruebas y calidad**. Los pasos de la tabla se transcriben del PDF `Plan_Desarrollo_SalesIA_Enterprise.pdf`. Antes de implementar pruebas, se revisará qué cobertura ya existe en el proyecto y qué falta. Los pasos figuran como pendientes de este seguimiento; eso no afirma que no existan pruebas previas.

## Estados

- **Completado:** implementación terminada y verificada frente al requisito.
- **En proceso:** existe trabajo hecho, pero falta completar o verificar una parte.
- **Pendiente:** todavía no se ha trabajado ese paso en este seguimiento; no significa que el código no tenga avances previos.

## Pasos de la fase 14

| Paso indicado en el PDF | Estado | Avance y pendiente |
|---|---|---|
| 1. Pruebas unitarias del motor estadístico | Completado | Se añadieron 10 casos unitarios para media, mediana, comparación de estadísticas, Bayes y variable aleatoria. Los 10 pasaron con el entorno virtual de backend. |
| 2. Pruebas de endpoints | Completado | Se añadieron pruebas de respuestas, validaciones y permisos para las rutas de salud/autenticación, organización, catálogos, clientes, ventas, inventario, analítica, reportes, insights, auditoría, usuarios, estadística, probabilidad y variables aleatorias. Las dependencias externas se simularon. |
| 3. Pruebas de integración | Completado | Tres flujos recorren el endpoint real, la validación, los servicios de cálculo y persistencia y los modelos ORM. La sesión conserva los objetos en memoria para probar relaciones y commit sin una conexión externa. |
| 4. Pruebas de formularios y navegación | Completado | Verificación visual en `localhost:5173`: se comprobaron la ruta a Categorías, su validación de campo obligatorio y cancelación sin cambios; navegación a Analytics con errores en español para valores vacíos/no numéricos; y la lista de Ventas y el formulario Nueva venta, con un producto añadido solo al carrito local y sin registrar la venta. |
| 5. Pruebas de cálculos y casos límite | Completado | Se añadió `backend/tests/test_calculation_edge_cases.py` con 33 casos: límites de Bayes, valores negativos/repetidos/decimales, distribución aleatoria, longitudes mínima/máxima, entradas no finitas e inválidas, y valores grandes. La prueba reveló desbordamiento en media y mediana para valores finitos grandes; se corrigieron ambos cálculos. Suite acumulada de pasos 1–5: **107 passed**, 1 advertencia deprecada de Starlette. |
| 6. Pruebas de aceptación | Completado | Cuatro escenarios API escritos como recorridos del usuario cubren análisis estadístico entendible, Bayes, distribución aleatoria y rechazo de datos vacíos sin guardar. Se ejecutó la suite acumulada (**111 passed**) y compiló el frontend para producción. La persistencia se aisló en pruebas; no se cambiaron datos reales. |

## Historial

| Fecha | Fase / paso | Cambio |
|---|---|---|
| 2026-10-05 | Fase 14 | Se transcribieron del PDF los seis requisitos de pruebas y calidad. Se revisó el estado de pruebas existentes antes de iniciar este paso. |
| 2026-10-05 | Fase 14 / paso 1 | Se añadió `backend/tests/test_statistics_service.py`; `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py` ejecutado desde `backend` terminó con 10 pruebas aprobadas. Son pruebas unitarias sin conexión a base de datos. |
| 2026-10-05 | Fase 14 / paso 2 | Se completaron pruebas de endpoints en los módulos API del proyecto mediante `test_statistics_endpoints.py`, `test_business_endpoints.py` y `test_extended_endpoints.py`. Ejecución conjunta con pruebas unitarias: 71 aprobadas; sin acceso a base compartida ni llamadas reales a Supabase. |
| 2026-10-05 | Fase 14 / paso 3 | Se añadieron tres pruebas de integración para comparación estadística, Bayes y variable aleatoria; verifican respuesta, objetos persistidos, relaciones, resultados y commit en una sesión en memoria. La suite completa quedó en 74 aprobadas. |
| 2026-10-05 | Fase 14 / paso 4 | Revisión visual de formularios y navegación en `localhost:5173`. Los casos de validación no persistieron datos y el formulario de venta se abandonó antes de enviarlo. Sesión cerrada al finalizar. |
| 2026-10-05 | Fase 14 / paso 5 | Se añadieron 33 pruebas de casos límite. Se corrigieron desbordamientos en la media (suma normalizada con `fsum`) y mediana (mitad de cada valor antes de sumar). Verificación acumulada de pasos 1–5: 107 pruebas aprobadas y 1 advertencia de deprecación de Starlette. |
| 2026-10-05 | Fase 14 / paso 6 | Se añadieron cuatro escenarios de aceptación orientados a los resultados que ve una persona usuaria. La suite acumulada de pasos 1–6 terminó con 111 pruebas aprobadas y una advertencia de deprecación de Starlette. `npm run build` terminó correctamente; Vite advierte que el bundle principal supera 500 kB. La fase 14 queda finalizada. |

## Paso 1 — Pruebas unitarias del motor estadístico

- Antes de este cambio, el proyecto no tenía una suite estándar de pruebas unitarias para `backend/app/services/statistics.py`; los scripts de comprobación existentes cubrían autenticación y permisos.
- Se probaron `calculate_mean`, `calculate_median`, `compare_statistics`, `calculate_bayes` y `analyze_random_variable`.
- Los casos verifican media con varios y un solo dato; mediana para cantidades impares y pares con datos desordenados; las tres interpretaciones de comparación; cálculo posterior y explicación de Bayes; y valor esperado, varianza y desviación estándar de una variable aleatoria, incluida una distribución constante.
- Verificación ejecutada desde la carpeta `backend`: `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py` → **10 passed**.
- Estas pruebas llaman directamente a los servicios y esquemas; no prueban endpoints, integración, interfaz ni aceptación. Esos alcances corresponden a los pasos siguientes de la fase.

## Paso 2 — Pruebas de endpoints

- Se probaron mediante `TestClient` los endpoints de salud y validación inicial del login; estadísticas (media, mediana, comparación, análisis de ventas); Bayes y variables aleatorias; organización (empresa y sucursales); categorías, productos, clientes e historial de clientes; ventas, inventario y dashboard; insights; generación/listado/descarga de reportes; roles y usuarios; auditoría; y estados de módulos.
- Los casos cubren respuestas satisfactorias y esquemas de respuesta, creación/actualización de recursos con respuestas HTTP esperadas, payloads inválidos HTTP 422, llamadas sin autenticación HTTP 401 y rol sin autorización HTTP 403.
- Para impedir escrituras o llamadas externas, la sesión SQLAlchemy, consultas SQL y funciones de persistencia se reemplazaron con dobles de prueba; la creación de cuentas de usuario usa un cliente Supabase simulado y la descarga usa un CSV temporal.
- Verificación ejecutada desde `backend`: `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py tests\test_statistics_endpoints.py tests\test_business_endpoints.py tests\test_extended_endpoints.py` → **71 passed**.
- La única advertencia es una deprecación de Starlette relacionada con el adaptador de `httpx` en `TestClient`; no afecta los resultados. El paso queda **Completado** para las rutas API existentes incluidas en la aplicación.

## Paso 3 — Pruebas de integración

- Se añadió `backend/tests/test_statistics_integration.py` para integrar FastAPI, autenticación sustituida, esquemas, servicios reales de cálculo, servicios reales de persistencia y modelos SQLAlchemy.
- El flujo de comparación comprueba la creación enlazada de dataset, variable, observaciones, análisis y tres resultados. Bayes verifica su registro específico vinculado al análisis. La variable aleatoria comprueba dataset, variable, observaciones, resultados y parámetros de distribución.
- Los tres casos verifican también valores de respuesta, empresa y usuario asociados, identificadores enlazados y una confirmación de transacción por solicitud.
- El límite de almacenamiento se sustituye por una sesión en memoria que guarda los objetos ORM y simula `flush`/`commit`. No se crea una conexión a PostgreSQL/Supabase y no se comprueba la ejecución del DDL ni las restricciones reales de PostgreSQL.
- Verificación conjunta de pasos 1 a 3, ejecutada desde `backend`: `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py tests\test_statistics_endpoints.py tests\test_business_endpoints.py tests\test_extended_endpoints.py tests\test_statistics_integration.py` → **74 passed**.

## Paso 4 — Pruebas de formularios y navegación

- Se revisó visualmente la navegación del Dashboard a Categorías, Analytics y Ventas; cada ruta abrió el módulo esperado.
- En Categorías, el intento de guardar el formulario vacío activó el mensaje de campo obligatorio del navegador. Se cerró con Cancelar y no se creó ninguna categoría.
- En Analytics, limpiar los datos y analizar mostró “Ingresa al menos un valor numérico”; ingresar texto junto a números mostró “Todos los valores deben ser numéricos”. Ambas respuestas aparecieron en pantalla antes de llamar al cálculo del backend.
- En Ventas, la tabla cargó; “Nueva venta” abrió el formulario con clientes y productos disponibles. Al añadir un producto se actualizó el carrito y se habilitó el botón de registro. Se volvió a la lista sin enviar la venta.
- No se crearon ni modificaron registros durante estos recorridos. La sesión se cerró y el navegador quedó en la pantalla de login.
- La revisión fue visual/manual en el navegador local. El frontend no tenía runner automatizado; se intentó instalar Vitest desde la caché local, pero faltaba metadata de paquetes y la instalación no se completó. No se modificaron `package.json` ni `package-lock.json`.

## Paso 5 — Pruebas de cálculos y casos límite

- Se añadió `backend/tests/test_calculation_edge_cases.py` con 33 casos para ceros, negativos, duplicados y decimales; eventos límite de Bayes; resultados negativos, probabilidad cero y distribución de un solo resultado; listas con el mínimo y máximo de 1000 elementos; listas vacías o mayores al máximo; valores `NaN` e infinitos; suma de probabilidades dentro y fuera de la tolerancia; y probabilidad de evidencia inválida.
- Las entradas finitas `1e308` expusieron un desbordamiento: la suma directa de valores producía `inf` en la media y sumar los dos valores centrales hacía lo mismo en la mediana. Se corrigió la media normalizando los valores antes de usar `fsum`, y la mediana ahora divide cada centro entre dos antes de sumarlos. Los resultados se mantienen finitos para esos datos.
- Ejecución individual: `.venv\Scripts\python.exe -m pytest -q tests\test_calculation_edge_cases.py` desde `backend` → **33 passed**.
- Suite acumulada de los pasos 1 a 5: `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py tests\test_statistics_endpoints.py tests\test_business_endpoints.py tests\test_extended_endpoints.py tests\test_statistics_integration.py tests\test_calculation_edge_cases.py` → **107 passed, 1 warning**. La advertencia corresponde a la deprecación de Starlette para el adaptador `httpx` de `TestClient`; no afecta las pruebas.
- Los datos `NaN` e infinitos se rechazan en la validación de entrada. Los cálculos aceptan los números finitos grandes probados; valores cuyo resultado matemático exceda el rango representable por `float` no forman parte de los casos aceptados.

## Paso 6 — Pruebas de aceptación

- El PDF solicita pruebas de aceptación, sin definir casos detallados. Se añadieron escenarios orientados a criterios comprensibles para quien usa SalesIA: comparar importes de ventas y recibir una interpretación, calcular la probabilidad de compra dado un evento y leer la explicación, obtener las medidas de una distribución y recibir un rechazo claro cuando el conjunto de datos está vacío.
- Cada escenario se ejecuta contra la aplicación FastAPI. La autenticación se sustituye por un usuario administrador de prueba y las funciones de persistencia se simulan; las escrituras quedan aisladas y no cambian datos de PostgreSQL/Supabase.
- También se verifica que los datos vacíos reciben HTTP 422 y no generan commit. La navegación y validación visual de formularios quedaron revisadas en el paso 4.
- Suite acumulada de pasos 1 a 6, ejecutada desde `backend`: `.venv\Scripts\python.exe -m pytest -q tests\test_statistics_service.py tests\test_statistics_endpoints.py tests\test_business_endpoints.py tests\test_extended_endpoints.py tests\test_statistics_integration.py tests\test_calculation_edge_cases.py tests\test_acceptance_user_flows.py` → **111 passed, 1 warning**. La advertencia Starlette sobre `httpx` en `TestClient` no afecta la ejecución.
- Compilación de producción frontend, ejecutada desde `frontend`: `npm run build` → **exit code 0**. Vite compiló TypeScript y empaquetó la aplicación; informa una advertencia de tamaño porque el chunk principal supera 500 kB.
- **Criterio de cierre:** los seis entregables del PDF tienen implementación o evidencia verificable y sus pruebas automatizadas pasan. Las pruebas de persistencia usan dobles y no sustituyen una validación de migraciones o de restricciones en PostgreSQL real.


