# Despliegue de Brisa Backend en Render

## Flujo de aprobación

La rama de trabajo es `feat/despliegue-render`, creada desde `origin/master`. Producción usa exclusivamente `master`. Subir la rama, revisar el PR y aprobarlo antes de integrar. Configurar una regla de protección de `master` que exija PR, aprobación y el check `validate`; esto requiere permisos de administración y no se aplica desde estos archivos.

El workflow valida pushes a esta rama y PR hacia `master`. La publicación solo se ejecuta en `master`, después de pasar las comprobaciones y si la variable `RENDER_DEPLOY_ENABLED` vale exactamente `true`. Mantenerla ausente o en `false` durante la preparación. Desactivar los despliegues automáticos de Render para que GitHub Actions controle las publicaciones posteriores. La creación inicial del servicio puede iniciar un primer despliegue desde Render.

## Servicio

Crear un Web Service Docker gratuito vinculado a este repositorio, rama `master`, Dockerfile `Dockerfile.production` y Health Check Path `/health`. `render.yaml` describe esa configuración; no crea una base de datos. Al usar un Blueprint, revisar el plan y completar las variables antes de confirmar su creación.

El contenedor usa Node 22, pnpm 11.17.0, genera Prisma sin conectarse a una base real, compila Nest, elimina dependencias de desarrollo y arranca `dist/src/main.js` como usuario sin privilegios. Incluye la plantilla de recuperación de contraseña. `NODE_PATH=/app/dist` permite resolver los imports existentes de `prisma/prisma.service`. `dotenv` es una dependencia de ejecución porque se importa desde `main.ts`. El contexto de Docker excluye `config/.env` y otros archivos locales con secretos.

Configurar en Render:

- `NODE_ENV=production`.
- `DATABASE_URL`: conexión PostgreSQL compatible con Prisma/adapter-pg y con el esquema que usa esta versión. Mantener los requisitos de TLS del proveedor.
- `PWA_ORIGINS`: origen HTTPS exacto de Cloudflare Pages, sin rutas; separar con comas si hay varios orígenes autorizados.
- S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`; opcionalmente `AWS_SESSION_TOKEN`, `AWS_S3_RESOURCE_PREFIX` y `AWS_S3_UPLOAD_EXPIRATION_SECONDS`. Usar permisos limitados al bucket/ruta necesarios.
- Autenticación entre módulos: `INTERNAL_MODULE_API_KEY_HASH_CHAT`, `INTERNAL_MODULE_API_KEY_HASH_SEGUIM`, `INTERNAL_MODULE_API_KEY_HASH_GAMIF` y `INTERNAL_MODULE_API_KEY_HASH_NOTIF`, cuando corresponda. El navegador no recibe estas credenciales.
- Correo en Render: `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `EMAIL_FROM` (remitente verificado) y opcionalmente `EMAIL_FROM_NAME=Brisa`. Cargar los secretos en el panel, nunca en el repositorio ni en el Dockerfile.
- Para entornos que permitan SMTP, `EMAIL_PROVIDER=smtp` conserva Nodemailer y las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER` y `SMTP_PASSWORD`. Si no se define proveedor se conserva SMTP por compatibilidad.
- Conservar las cookies seguras de producción y SameSite=Lax. El frontend llama a su propio origen mediante `/api`.

No cambiar `TRUST_PROXY` sin verificar la cadena de proxies y su efecto sobre la IP que utiliza la aplicación. No compartir el entorno de producción con previews que puedan activar jobs o modificar sus datos.

## GitHub Actions

En Settings > Secrets and variables > Actions, configurar:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secret | RENDER_DEPLOY_HOOK_URL | Deploy hook del servicio; permite desplegar y debe permanecer secreto |
| Variable | RENDER_SERVICE_URL | Origen HTTPS público del servicio Render |
| Variable | RENDER_DEPLOY_ENABLED | false durante la preparación; true cuando esté configurado |

El pipeline verifica tipos, lint del health check y de los nuevos adaptadores de correo, tests unitarios, e2e de cronograma con dobles de prueba, compilación, dependencias compiladas y construcción de la imagen. El lint se limita a los archivos de esta entrega; no certifica todo el código existente. Jest resuelve los imports desde la raíz mediante `modulePaths`, siguiendo la decisión documentada en el handoff.

El deploy hook recibe el SHA validado. Después, el script espera que `/health` responda con ese mismo SHA mediante `RENDER_GIT_COMMIT`; una versión anterior no cuenta como éxito. Este endpoint comprueba que el proceso HTTP responde, no certifica la disponibilidad de PostgreSQL, S3 ni correo.

## Comprobaciones antes del PR

Con Node 22 y pnpm 11.17.0:

```sh
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm exec jest --runInBand
pnpm test:e2e:cronograma
pnpm run build
docker build -f Dockerfile.production -t brisa-backend:check .
```

Para generar Prisma en CI/construcción se usa una URL ficticia, sin operaciones SQL. No ejecutar `prisma db push`, migraciones ni el servidor completo contra la base compartida para validar esta entrega. La importación de módulos en `scripts/check-production.cjs` no crea Nest ni activa Prisma/jobs. Fuera de Docker necesita `NODE_PATH` apuntando a `dist`.

## Pendientes para una prueba funcional completa

- El adaptador Brevo ya permite enviar por API HTTPS, sin usar los puertos SMTP bloqueados de Render. Falta crear la cuenta, verificar el remitente, completar la autenticación que solicite Brevo y cargar la clave. Las pruebas de código simulan el proveedor; todavía no se ha probado una entrega real.
- Render gratuito suspende el servicio tras inactividad. Los jobs de Nest y eventos dentro del proceso no se ejecutan durante la suspensión. Para tareas con hora garantizada hará falta un ejecutor persistente/externo y una estrategia de concurrencia.
- Esta rama parte de `master`: el trabajo de Chat y contenido vigente que existe en otra rama no se integra automáticamente aquí.
- Acordar cualquier migración de esquema por separado. La imagen y el workflow no migran ni crean tablas.
- Tras configurar ambos servicios, comprobar inicio/cierre de sesión, CSRF, rutas del cronograma, errores del backend y reactivación tras suspensión en un entorno de prueba con datos autorizados.

Referencias: [Render gratuito](https://render.com/docs/free), [deploy hooks](https://render.com/docs/deploy-hooks), [Blueprint](https://render.com/docs/blueprint-spec), [variables de entorno](https://render.com/docs/environment-variables).

## Configurar el correo de recuperación

1. Crear una cuenta gratuita en Brevo y habilitar su servicio de correo transaccional. El plan gratuito incluye hasta 300 envíos diarios, sujeto a sus límites y validaciones.
2. Registrar y verificar el remitente; completar los requisitos de autenticación de dominio que indique Brevo.
3. Generar una clave API de envío y guardarla en Render como `BREVO_API_KEY`. No usar la contraseña SMTP como clave API.
4. Configurar `EMAIL_PROVIDER=brevo`, `EMAIL_FROM` con la dirección verificada y `EMAIL_FROM_NAME=Brisa`. El Blueprint ya declara esos campos.
5. Tras aprobar el despliegue y autorizar un destinatario de prueba, comprobar la recuperación completa y la llegada del código. No se envían correos reales durante CI.

Se conserva el puerto `EmailService`, la plantilla y la vigencia del código existente. El adaptador usa `fetch` de Node, timeout de 10 segundos y errores que no incluyen la clave, el código ni el cuerpo del proveedor. Una configuración Brevo sin clave o remitente impide arrancar el servicio, para detectar el problema antes de aceptar solicitudes.

Referencias: [API transaccional de Brevo](https://developers.brevo.com/docs/send-a-transactional-email), [límites del plan gratuito](https://help.brevo.com/hc/en-us/articles/8292912279954-Add-or-remove-emails-from-your-plan).
