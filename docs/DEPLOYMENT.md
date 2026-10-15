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
- Correo en Render: `EMAIL_PROVIDER=mailjet`, `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `EMAIL_FROM` (remitente verificado) y opcionalmente `EMAIL_FROM_NAME=Brisa`. Cargar ambas claves en el panel, nunca en el repositorio ni en el Dockerfile. `render.yaml` declara Mailjet como proveedor para los servicios nuevos.
- Brevo sigue disponible con `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` y el mismo remitente/nombre. La selección es explícita; un fallo de Mailjet no dispara otro envío con Brevo o SMTP.
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

- Mailjet permite enviar por API HTTPS, sin usar los puertos SMTP bloqueados de Render. Falta verificar el remitente, completar las validaciones de la cuenta que solicite Mailjet y cargar ambas claves. Las pruebas de código simulan el proveedor; todavía no se ha probado una entrega real.
- Render gratuito suspende el servicio tras inactividad. Los jobs de Nest y eventos dentro del proceso no se ejecutan durante la suspensión. Para tareas con hora garantizada hará falta un ejecutor persistente/externo y una estrategia de concurrencia.
- Esta rama parte de `master`: el trabajo de Chat y contenido vigente que existe en otra rama no se integra automáticamente aquí.
- Acordar cualquier migración de esquema por separado. La imagen y el workflow no migran ni crean tablas.
- Tras configurar ambos servicios, comprobar inicio/cierre de sesión, CSRF, rutas del cronograma, errores del backend y reactivación tras suspensión en un entorno de prueba con datos autorizados.

Referencias: [Render gratuito](https://render.com/docs/free), [deploy hooks](https://render.com/docs/deploy-hooks), [Blueprint](https://render.com/docs/blueprint-spec), [variables de entorno](https://render.com/docs/environment-variables).

## Configurar el correo de recuperación

1. Crear una cuenta gratuita en Mailjet y confirmar el correo de registro. El plan Free incluye hasta 6.000 correos al mes y 200 al día, sujeto a sus validaciones y límites.
2. En **Account Settings > Senders & Domains > Add a sender address**, agregar la dirección de Brisa y abrir el enlace de confirmación recibido. Comprobar que el remitente figure como **Active** en la cuenta/API key que se utilizará.
3. En **Account Settings > API Key Management**, obtener la **API Key** y la **Secret Key**. La clave secreta solo se muestra al crearla; guardarla de forma segura. Si ya no está disponible, usar **Reset Secret Key**, teniendo en cuenta que invalida la clave anterior.
4. En el servicio backend de Render, abrir **Environment** y cargar:

   ```dotenv
   EMAIL_PROVIDER=mailjet
   MAILJET_API_KEY=<API Key de Mailjet>
   MAILJET_SECRET_KEY=<Secret Key de Mailjet>
   EMAIL_FROM=<dirección verificada en Mailjet>
   EMAIL_FROM_NAME=Brisa
   ```

   No se necesitan variables `SMTP_*` ni `BREVO_API_KEY` para esta selección. En local, se pueden conservar las variables SMTP para usar `EMAIL_PROVIDER=smtp`; no mezclar las claves reales en un archivo versionado. Si el servicio Render ya existía, cambiar estas variables en su panel; actualizar el Blueprint en Git no reemplaza por sí solo la configuración de un servicio creado manualmente.
5. Tras aprobar el despliegue y autorizar un destinatario de prueba, comprobar la recuperación completa, la llegada del código y su uso dentro de la vigencia existente. Revisar también el estado del mensaje en Mailjet. Una aceptación de API no garantiza la entrega en la bandeja de entrada. No se envían correos reales durante CI.

Para pruebas se puede verificar una dirección individual de Gmail/Outlook. Mailjet advierte que usar un remitente de correo gratuito puede provocar spam o rechazos porque no se puede autenticar su dominio con SPF/DKIM. Comprobar la entrega con los destinatarios de prueba; para un servicio fiable, usar un dominio propio autenticado cuando esté disponible. Registrar la cuenta no certifica la entrega ni que hayan terminado todas sus validaciones.

Se conserva el puerto `EmailService`, la plantilla y la vigencia del código existente. El adaptador usa `fetch` de Node con Basic Auth sobre HTTPS, timeout de 10 segundos, redirecciones bloqueadas y seguimiento de aperturas/clics desactivado. Solo considera aceptado el envío cuando la respuesta HTTP es exitosa y contiene un único mensaje con `Status=success`. Los errores no incluyen claves, códigos ni el cuerpo del proveedor. Una configuración Mailjet sin cualquiera de las dos claves o sin remitente impide arrancar el servicio, para detectar el problema antes de aceptar solicitudes.

Referencias: [Send API v3.1 de Mailjet](https://dev.mailjet.com/docs/email-api/send-api-v31/send-basic-email), [verificar un remitente](https://documentation.mailjet.com/hc/en-us/articles/360042759253-How-to-add-a-sender-address), [API Key y Secret Key](https://documentation.mailjet.com/hc/en-us/articles/360043225693-What-is-an-API-key), [plan gratuito](https://www.mailjet.com/pricing/), [limitaciones de remitentes gratuitos](https://documentation.mailjet.com/hc/en-us/articles/19308800104091-Why-you-should-avoid-free-webmail-as-a-sender-address).
