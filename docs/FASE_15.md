# Registro de avance — Fase 15: Despliegue

La lista de esta fase se transcribe del PDF `Plan_Desarrollo_SalesIA_Enterprise.pdf`. Este documento comienza la fase; los puntos permanecen pendientes hasta revisar e implementar su configuración de despliegue.

## Pasos de la fase 15

| Paso indicado en el PDF | Estado | Avance y pendiente |
|---|---|---|
| Configurar frontend | En proceso | Se preparó `frontend/vercel.json` para el fallback de las rutas SPA y `frontend/.env.example` para `VITE_API_URL`. En el proyecto de Vercel se debe elegir `frontend` como Root Directory, compilar con `npm run build` y publicar `dist`. Falta conectarlo y probar un deployment real. |
| Configurar backend | En proceso | Se creó `render.yaml` con raíz `backend`, instalación de `requirements.txt`, arranque Uvicorn y health check `/api/v1/health`; `backend/.python-version` fija Python 3.12.14, igual al entorno probado. Falta crear/conectar el servicio y comprobar su arranque real. |
| Configurar PostgreSQL | En proceso | La aplicación ya usa PostgreSQL gestionado por Supabase; el Blueprint solicita `DATABASE_URL` sin guardar credenciales en Git. Falta confirmar conectividad desde Render y el revision de Alembic de la base destino. |
| Definir variables de entorno | En proceso | El Blueprint define ajustes de producción y solicita en el panel los valores de base de datos, Supabase y CORS. Genera `SECRET_KEY` en Render. Falta ingresar los valores y validar la configuración desplegada. |
| Configurar CORS y HTTPS | En proceso | Render recibirá `CORS_ORIGINS` como variable y el servicio usa HTTPS gestionado por Render; Vercel también sirve el frontend por HTTPS. Falta establecer el dominio final de Vercel y validar las solicitudes reales entre ambos dominios. |
| Ejecutar migraciones | Pendiente | El historial local tiene una cabeza única (`d06291d6360c`), pero no se verificó el estado aplicado en Supabase. No ejecutar `alembic upgrade head` hasta confirmar esa versión y el esquema de destino: hay migraciones que alteran `users` y actualizan el DNI del administrador. |
| Verificar logs y monitoreo | En proceso | Render tendrá el endpoint de health check y los logs del servicio estarán disponibles en el panel. Falta desplegar y comprobar logs, health checks y errores reales. |

## Historial

| Fecha | Fase / paso | Cambio |
|---|---|---|
| 2026-10-05 | Fase 15 | Se abrió el registro independiente de despliegue y se transcribieron los siete entregables del PDF. |
| 2026-10-05 | Fase 15 / preparación Vercel y Render | Se añadieron configuración SPA y plantilla de variable pública para Vercel, Blueprint de Render con variables secretas externas, health check y versión de Python fijada. No se crearon servicios remotos, no se publicaron credenciales y no se ejecutaron migraciones. |
| 2026-10-05 | Fase 15 / validación de configuración | Los JSON/YAML se parsearon y verificaron localmente; `npm run build` en `frontend` terminó con código 0. No valida aún un despliegue real ni la conectividad desde Render a Supabase. |

## Configuración preparada

- **Vercel:** enlazar el repositorio y establecer `frontend` como directorio del proyecto. Los comandos son instalación `npm install`/`npm ci`, build `npm run build` y salida `dist`. La variable de build `VITE_API_URL` debe tener la URL HTTPS pública del API y el prefijo, por ejemplo `https://<servicio>.onrender.com/api/v1`. Esta variable queda dentro del JavaScript público; solo debe contener la URL, nunca una clave privada. El `vercel.json` redirige las rutas del cliente (por ejemplo `/login`) a `index.html` para que el router React las resuelva.
- **Render:** sincronizar el Blueprint `render.yaml` ubicado en la raíz del repositorio. El servicio usa `backend` como directorio, instala dependencias fijadas en `requirements.txt`, arranca `app.main:app` mediante Uvicorn y expone el chequeo `/api/v1/health`. La variable `PYTHON_VERSION` fija Python en `3.12.14`, igual al entorno local validado.
- **Variables Render:** durante la creación, proporcionar `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `CORS_ORIGINS` en la configuración privada del servicio. `SECRET_KEY` se genera automáticamente. `CORS_ORIGINS` debe ser el origen exacto del sitio Vercel, sin ruta; admite varios orígenes separados por comas. Mantener `ENVIRONMENT=production` y `DEBUG=false`.
- **Base:** conservar Supabase como PostgreSQL existente; desde Render se conectará por el hostname público de Supabase usando SSL (`sslmode=require`). No se crea ni migra otra instancia PostgreSQL de Render.
- **Migraciones:** una consulta local al grafo confirmó `d06291d6360c` como única cabeza de Alembic. La migración base es vacía (`pass`) y las posteriores presuponen tablas existentes, por lo que la versión registrada y el esquema real de Supabase deben comprobarse antes de correr cualquier migración. Aún no se aplicó ninguna.
- **Límite actual:** se preparó infraestructura como código, pero el despliegue está pendiente de enlazar el repositorio y sus dominios en las cuentas Vercel/Render. Aún no se ha confirmado el origen final `*.vercel.app`; por ello CORS y la URL final del API no se pueden cerrar todavía.

## Referencias oficiales

- [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Rewrites en Vercel](https://vercel.com/docs/routing/rewrites)
- [Desplegar FastAPI en Render](https://render.com/docs/deploy-fastapi)
- [Blueprints de Render](https://render.com/docs/blueprint-spec)
- [Versiones de Python en Render](https://render.com/docs/python-version)
- [Conexión a PostgreSQL de Render](https://render.com/docs/postgresql-creating-connecting)
