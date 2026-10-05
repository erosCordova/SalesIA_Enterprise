# Registro de avance — Fase 13: Seguridad y control de acceso

Este archivo registra exclusivamente el avance de la fase 13. Los requisitos se toman del PDF `Plan_Desarrollo_SalesIA_Enterprise.pdf`; el repositorio se revisa para identificar qué ya existe y qué falta. Los documentos de otras fases se mantienen en archivos separados.

## Estados

- **Completado:** implementación terminada y verificada frente al requisito.
- **En proceso:** existe trabajo hecho, pero falta completar o verificar una parte.
- **Pendiente:** todavía no se ha trabajado ese paso en este seguimiento; no significa que el código no tenga avances previos.

## Fase 13 — Seguridad y control de acceso

| Paso indicado en el PDF | Estado | Avance y pendiente |
|---|---|---|
| 1. Roles y permisos | Completado | Se verificaron los cinco roles con inicio de sesión, menú, módulo representativo y restricciones de administración. También se revisó visualmente la guía de rol al crear usuarios. La auditoría global y unificada de todas las rutas queda como mejora pendiente, no bloquea esta validación funcional del paso. |
| 2. Protección de endpoints | Completado | Se protegieron con autenticación los cinco endpoints de estado de módulos que estaban expuestos. La revisión del esquema OpenAPI confirma que en la API solo quedan públicos el login y el chequeo de salud. Se verificaron respuestas 401 para solicitudes sin sesión. |
| 3. Validación de entrada | Completado | Se reforzaron validaciones en esquemas y parámetros de API, incluidas fechas, identificadores, tamaños de listas, números finitos y consistencia de probabilidades. Se normalizan textos de entrada y la interfaz convierte errores HTTP 422 en mensajes en español. La compilación y comprobaciones focalizadas de backend y navegador pasaron. |
| 4. Registro de acciones críticas | Completado | Se implementó el registro transaccional y la consulta/pantalla del historial. Además de compilar frontend y backend, se guardó desde la interfaz una categoría con los mismos valores que ya tenía y el historial mostró la acción, actor, rol, sección y fecha. |
| 5. Control de sesiones | Completado | Se registra y respeta el vencimiento entregado por el proveedor de autenticación, se cierra la sesión vencida, se sincroniza el cierre entre pestañas y las respuestas 401 invalidan la sesión activa. La compilación de producción pasó y la aplicación redirigió al login al vencerse la sesión existente. |
| 6. Gestión segura de secretos | Completado | La configuración usa `backend/.env`, excluido por `.gitignore`; `backend/.env.example` contiene valores ficticios; el backend valida requisitos mínimos de secretos en producción y no se encontró ninguna clave de servidor en el código del frontend. La clave local `SECRET_KEY` fue regenerada. La copia de trabajo no incluye `.git`, por lo que no fue posible revisar el historial de commits.

### Paso 1 — Roles y permisos: detalle del avance

- Roles contemplados por la aplicación: Administrador, Gerente, Vendedor, Analista y Almacén.
- La API comprueba permisos de rol y la aplicación web impide la navegación a módulos no asignados al rol.
- La pantalla **Acceso y seguridad → Nuevo usuario** explica con lenguaje cotidiano las áreas disponibles para el rol seleccionado.
- Para los reportes, se aplican permisos predeterminados de lectura, generación y descarga a Gerente y Analista, y acceso total a Administrador, cuando `roles.permissions` no tiene una configuración guardada. Si hay una configuración explícita, esta sigue teniendo prioridad.
- Los rechazos de acceso a reportes muestran un mensaje comprensible y no exponen claves internas como `reports.read`.
- Verificación local: el frontend compiló y Vite respondió HTTP 200; el backend compiló, Uvicorn inició y `/api/v1/health` respondió HTTP 200. Se comprobaron cinco casos de permisos de reportes: Gerente, Analista y Administrador sin configuración; Vendedor sin permiso; y Gerente con configuración explícitamente vacía. Los cinco resultados fueron los esperados.
- El lint terminó sin errores, con 17 advertencias en varios componentes. La compilación de producción también avisó que el bundle JavaScript supera 500 kB minificado; no impidió generar la versión de producción.
- Primer intento aislado con `TestClient`: la consulta a la base de datos falló con `OperationalError` y el login devolvió HTTP 500; en ese intento no se creó ninguna cuenta. Esto correspondió al entorno aislado de esa prueba.
- Repetición contra el servidor activo del usuario: el inicio de sesión de Administrador funcionó. Se crearon cinco cuentas persistentes de prueba (DNI `99000001`–`99000005`, una para cada rol) y se restablecieron sus claves; no se guardan contraseñas en este documento.
- Validación con esas cuentas: login y endpoint representativo respondieron HTTP 200 para Administrador (`/users`), Gerente (`/reports`), Vendedor (`/customers`), Analista (`/reports`) y Almacén (`/inventory`). La consulta administrativa `/users` respondió HTTP 403 para Gerente, Vendedor, Analista y Almacén.
- Revisión visual en `localhost:5173`: se inició sesión con cada rol; se confirmaron sus menús y se abrieron páginas representativas de Gerente (Reportes), Vendedor (Clientes), Analista (Analytics) y Almacén (Inventario). Gerente fue redirigido al Dashboard al intentar entrar directamente a Acceso y seguridad. Como Administrador se comprobó la lista de usuarios y el formulario de alta; la explicación y las áreas asignadas cambiaron al seleccionar distintos roles. Al finalizar, se volvió a dejar abierta la página Acceso y seguridad con las cinco cuentas de prueba activas.
- La consola del navegador no registró errores durante la revisión. Esta prueba cubre el recorrido funcional y visual representativo de cada rol; una auditoría global de todas las rutas del backend contra una matriz unificada queda como trabajo adicional.

### Paso 2 — Protección de endpoints: detalle del avance

- Se detectaron cinco endpoints `/status` que no validaban sesión: Comercial, Analytics, Dashboard, Reportes e Inventario.
- Se agregó autenticación y, para Inventario y Analytics, se respetaron además los roles habilitados para esas áreas. Las rutas funcionales existentes conservan sus dependencias de rol o permiso.
- Se mantienen públicos `POST /api/v1/auth/login` y `GET /api/v1/health`, necesarios para iniciar sesión y comprobar disponibilidad. El endpoint raíz `/` también es informativo y público, fuera de la API versionada.
- Verificación enfocada con `TestClient`: los cinco endpoints de estado devolvieron HTTP 401 sin token; `/api/v1/health` devolvió HTTP 200 y el login sin cuerpo de credenciales devolvió HTTP 422 por validación, sin exigir sesión.
- Revisión del esquema OpenAPI: las únicas operaciones de `/api/v1` sin seguridad Bearer son `POST /api/v1/auth/login` y `GET /api/v1/health`.
- Prueba visual en `localhost:5173` con sesión de Administrador: la página de Acceso y seguridad cargó; Reportes mostró el formulario y el estado vacío esperado; Inventario mostró sus indicadores y terminó de cargar la tabla. La consola del navegador no registró errores. No se crearon ni modificaron registros durante esta revisión.
- `TestClient` emitió una advertencia de deprecación relacionada con el uso de `httpx` en Starlette; las comprobaciones terminaron correctamente.

### Paso 3 — Validación de entrada: detalle del avance

- Se mantuvieron y ampliaron las validaciones del backend: números estadísticos finitos con listas entre 1 y 1000 valores; distribuciones aleatorias finitas con máximo de 1000 valores/probabilidades; ventas con entre 1 y 100 productos; correos opcionales con formato comprobado; y textos de solicitud normalizados quitando espacios exteriores. Las contraseñas conservan los espacios intencionales, pero una contraseña compuesta solo por espacios se rechaza.
- Las fechas iniciales no pueden ser posteriores a las finales en reportes, análisis de ventas ni dashboard analítico. Los identificadores de vendedor, categoría y descarga de reportes se validan como UUID. Los filtros de búsqueda aceptan hasta 100 caracteres.
- Bayes rechaza probabilidades individualmente fuera de rango y combinaciones matemáticamente incompatibles; la interfaz muestra el motivo en español. Las distribuciones aleatorias conservan la validación de cantidades iguales y suma total de probabilidades igual a 1.
- La interfaz traduce los errores de validación HTTP 422 a mensajes breves en español y nombres de campos comprensibles.
- Verificación de modelos Pydantic: se rechazaron valores NaN/Infinity, listas sobre el límite, probabilidades incompatibles, fechas invertidas, UUID mal formados, correos inválidos, documentos/campos requeridos en blanco y contraseñas vacías de espacios; se comprobó que los valores válidos sigan aceptándose.
- Verificación con `TestClient`: cuatro solicitudes inválidas a Bayes, generación de reportes, búsqueda de clientes y descarga de reporte respondieron HTTP 422, sin ejecutar operaciones de escritura.
- Verificación visual en `localhost:5173`: al ingresar una combinación Bayes incompatible, la pantalla mostró el mensaje en español y no presentó resultado ni guardó análisis. No aparecieron errores nuevos en consola tras recargar la aplicación. Durante una actualización en caliente de Vite se registró transitoriamente un error de contexto de autenticación; una recarga completa recuperó la aplicación y la prueba posterior pasó.
- `npm run build` pasó. `npm run lint` terminó sin errores y reportó 16 advertencias en hooks/componentes existentes, sin advertencias en el cliente API modificado. Se conserva el aviso de bundle JavaScript mayor a 500 kB. `TestClient` reportó una advertencia de deprecación de Starlette/httpx; no afectó los resultados.

### Paso 4 — Registro de acciones críticas: detalle del avance

- El repositorio ya contaba con el modelo `audit_logs` y la navegación a Auditoría, pero no se guardaban eventos; la pantalla solo mostraba la disponibilidad del módulo. La documentación de base de datos del proyecto incluye `audit_logs` entre las tablas existentes.
- Se agregó un servicio que registra el evento en la misma transacción que el cambio de negocio. Si la escritura de auditoría falla, también se revierte el cambio principal, evitando que una operación quede sin trazabilidad.
- Se registran creación de usuarios; actualización de empresa y sucursales; alta, modificación y desactivación de clientes, categorías y productos; ventas; y generación/descarga de reportes.
- El evento guarda el actor, empresa, acción, sección y referencia del registro. Los detalles se limitan a tipo de reporte, total y cantidad de artículos de una venta, rol/estado asignado, o nombres de campos modificados. No se registran contraseñas, tokens, documentos personales, correo ni valores de contacto.
- Se agregó `GET /api/v1/audit?limit=100`, limitado a la empresa del usuario autenticado y a Administrador/Gerente. La vista presenta acciones y secciones con etiquetas en español, persona, rol y fecha/hora; el identificador se muestra truncado como referencia.
- Verificación realizada: `py_compile` aprobó los módulos Python modificados; `npm run build` aprobó; la pantalla abrió como Administrador. Se guardó la categoría existente `comersio` con el mismo nombre, descripción y estado, sin cambiar sus valores. La página confirmó “Categoría actualizada correctamente” y Auditoría mostró “Actualizó una categoría”, actor, rol, sección y fecha/hora. El evento queda como evidencia del historial; no se creó una categoría adicional ni se alteró el contenido del catálogo. La compilación conserva el aviso preexistente de bundle superior a 500 kB.

### Paso 5 — Control de sesiones: detalle del avance

- El PDF incluye el requisito “Control de sesiones” sin enumerar subpasos. Se completó controlando el vencimiento real que devuelve el proveedor de autenticación (`expires_in`); no se fijó un tiempo de inactividad arbitrario.
- Al iniciar sesión se guarda la hora de expiración junto al token. Para sesiones que ya estaban abiertas se obtiene el vencimiento del campo `exp` del JWT solo para temporizar el cierre; el backend sigue validando el token con el proveedor en cada endpoint protegido.
- Al llegar el vencimiento, la aplicación borra token, usuario y fecha de expiración y vuelve al login. La misma limpieza sucede si la API responde HTTP 401. El evento de almacenamiento sincroniza el cierre cuando el usuario sale o la sesión expira en otra pestaña.
- Verificación: `npm run build` pasó. Durante la recarga del frontend, la sesión previa ya vencida se limpió y la aplicación quedó en la pantalla de inicio de sesión. Se mantiene el aviso conocido de tamaño del bundle superior a 500 kB.

### Paso 6 — Gestión segura de secretos: detalle del avance

- La configuración local se guarda en `backend/.env`. Las reglas actuales de `.gitignore` excluyen `.env`, `.env.*` y los archivos de entorno de backend/frontend.
- Se reemplazó `backend/.env.example` por una plantilla con valores ficticios, instrucciones para crear una clave aleatoria y una nota explícita para mantener las claves de servidor solo en `backend/.env`.
- `DEBUG` ahora tiene valor predeterminado seguro (`false`). Si `ENVIRONMENT` es `production` o `prod`, la configuración falla al iniciar cuando `DEBUG` está activo, `SECRET_KEY` es menor a 32 caracteres o parece un marcador de ejemplo, o falta `SUPABASE_SECRET_KEY`.
- La revisión de fuentes no encontró asignaciones de credenciales ni claves privadas en backend, frontend o documentación. La única variable Vite encontrada es `VITE_API_URL`; no hay claves de servidor expuestas al bundle del frontend.
- La `SECRET_KEY` del entorno local se reemplazó por una clave aleatoria nueva. El backend debe reiniciarse para cargarla.
- Verificación: `py_compile` de configuración e importación de la aplicación pasaron sin mostrar valores de entorno; se comprobó que la clave local nueva cumple el mínimo de longitud.
- Resultado del paso: el proyecto ya administra su configuración sensible mediante variables de entorno locales, excluye los archivos `.env` del repositorio, usa una plantilla sin credenciales reales y valida la configuración de producción. No se encontraron secretos de servidor en el código del frontend. La revisión del historial Git queda fuera de lo comprobable en esta copia porque no contiene la carpeta `.git`.

## Historial

| Fecha | Fase / paso | Cambio |
|---|---|---|
| 2026-10-04 | Fase 13 / paso 1 | Se documentó el estado existente, se agregó información de acceso visible al asignar roles y se añadió un valor predeterminado para los permisos de reportes. |
| 2026-10-04 | Fase 13 / paso 1 | Compilación del frontend/backend aprobada, health HTTP 200 y cinco comprobaciones de permisos aprobadas. Lint sin errores, con advertencias existentes; queda revisión visual y auditoría completa de rutas. |
| 2026-10-04 | Fase 13 / paso 1 | Prueba de ejecución local: frontend y backend levantaron en puertos de verificación y respondieron HTTP 200. Los procesos de prueba se detuvieron al terminar. |
| 2026-10-04 | Fase 13 / paso 1 | Intento de prueba integral: fallo de conexión con la base de datos impidió iniciar sesión; no se crearon usuarios. Automatización visual no disponible en este entorno. |
| 2026-10-04 | Fase 13 / paso 1 | Contra el servidor activo se crearon y probaron cinco cuentas (una por rol): inicio de sesión y endpoint principal HTTP 200; acceso a administración de usuarios bloqueado con HTTP 403 para los cuatro roles no administradores. Las contraseñas se entregan por la conversación y no se guardan en `docs`. |
| 2026-10-04 | Fase 13 / paso 1 | Revisión completada en `localhost:5173`: inicio de sesión, menús y módulos representativos verificados para los cinco roles; redirección y restricción de Gerente confirmadas; formulario de asignación de roles revisado; consola del navegador sin errores. |
| 2026-10-04 | Fase 13 / paso 2 | Se protegieron los cinco endpoints de estado sin autenticación. Comprobaciones HTTP confirmaron 401 sin token; OpenAPI confirmó que solo login y salud permanecen públicos dentro de `/api/v1`. |
| 2026-10-04 | Fase 13 / paso 2 | Prueba visual posterior en la aplicación: Administrador navegó por Acceso y seguridad, Reportes e Inventario; las vistas se cargaron y la consola no mostró errores. No se alteraron datos. |
| 2026-10-05 | Fase 13 / paso 3 | Validaciones de fechas, números, UUID, listas, textos, correos, probabilidades y parámetros de búsqueda ampliadas. Errores 422 se presentan en español; validaciones Pydantic, TestClient, compilación frontend y recorrido visual completados. |
| 2026-10-05 | Fase 13 / paso 4 | Registro transaccional añadido para acciones críticas y consulta del historial limitada por empresa. Una actualización visual sin cambio de valores confirmó que la acción aparece con actor, rol, sección y fecha. Paso completado. |
| 2026-10-05 | Fase 13 / paso 5 | Se implementó vencimiento automático de sesión, limpieza ante HTTP 401 y sincronización del cierre entre pestañas. La compilación pasó y se observó la redirección al login de una sesión vencida. |
| 2026-10-05 | Fase 13 / paso 6 | Gestión local de secretos documentada: `.env` excluido, plantilla con marcadores ficticios, validación de configuración de producción y clave local regenerada. Revisión de historial Git no verificable en esta copia de trabajo. |


