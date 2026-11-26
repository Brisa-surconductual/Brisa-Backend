# HU-336 — Permisos de acceso individual (integración del backend)

## Estado

IMPLEMENTADA en la rama `feat/336-be-permisos-integracion` (5 commits sobre `origin/develop`, `770f274`: 4 de código y el del contrato), pendiente de revisión. El PR (contra `develop`, borrador) no se ha mergeado y requiere el visto bueno del líder (nivel 3 del flujo, enmienda E7 del brief BE-336). Este contrato describe el estado final del código de esa rama.

Amplía el contrato de gestión de permisos individuales de RF-04 (PR #87, ya en `develop`) con un endpoint nuevo, un campo nuevo y tres cambios de comportamiento (ver «Cambios de comportamiento respecto a develop»).

## Operación y acceso

Los cuatro endpoints viven en `PermisosIndividualesController` (`@Controller('admin/permisos-individuales')`). No hay prefijo global de rutas.

| Método y ruta | Éxito | Descripción |
| --- | --- | --- |
| `POST /admin/permisos-individuales` | 201 | Concede un permiso a un administrativo sobre un participante. |
| `GET /admin/permisos-individuales` | 200 | Lista paginada de permisos (global o de un participante). |
| `GET /admin/permisos-individuales/beneficiarios` | 200 | Administrativos activos a quienes se puede conceder (nuevo). |
| `POST /admin/permisos-individuales/:id_permiso/revocar` | 200 | Revoca un permiso. |

Acceso, igual en los cuatro:

- Rol: solo `COORDINADOR_PSI` (`@Roles(Rol.COORDINADOR_PSI)` + `RolesGuard`). Un `ADMINISTRATIVO` recibe 403.
- Sesión por cookie, con alcance `COMPLETA` (`SessionAuthGuard`, `SessionScopeGuard`).
- CSRF: cabecera `X-CSRF-Token` obligatoria **solo en los dos POST** (`CsrfSessionGuard`). Los GET no la exigen.
- Las respuestas de éxito (200 y 201) llevan `Cache-Control: no-store`. Las de error (filtro, excepciones de negocio, guardas, parser) no la llevan: no hay un middleware global que la ponga.
- Nombres de campo en `snake_case`; sin envoltura `{ data }`; fechas en ISO 8601 UTC (`toISOString()`).
- Los 400 de validación salen por el filtro `SolicitudInvalidaPermisosFilter` (`@UseFilters` del controlador). Los errores de negocio, por `PermisoIndividualException`. Ambos con el sobre `{ status, codigo, mensaje }`.

## Request

### `POST /admin/permisos-individuales`

Body JSON (`OtorgarPermisoIndividualDtoRequest`). `whitelist` + `forbidNonWhitelisted` del `ValidationPipe` global: un campo de más es 400.

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `codigo_participante` | string | Sí | Se recorta y se pasa a mayúsculas antes de validar. 1 a 16 caracteres, `^[A-Z0-9-]+$`. |
| `alcance` | string | Sí | `ACCESO_INDIVIDUAL` o `PROGRESION_NARRATIVA`. |
| `fecha_fin_vigencia` | string ISO 8601 \| `null` | No | `IsDateString({ strict: true })`; ausente o `null` = sin fin (dura hasta que se revoque). Debe ser posterior al momento actual (si no, 422 `VIGENCIA_INVALIDA`). |
| `id_usuario_beneficiario` | string UUID | Sí | UUID del administrativo que recibe el permiso (sale del endpoint de beneficiarios). |

```json
{
  "codigo_participante": "P-0A1B2C3D",
  "alcance": "ACCESO_INDIVIDUAL",
  "fecha_fin_vigencia": "2027-03-01T00:00:00.000Z",
  "id_usuario_beneficiario": "00000000-0000-4000-8000-000000000001"
}
```

El otorgante sale de la sesión, nunca del cliente.

### `GET /admin/permisos-individuales`

Query (`ListarPermisosIndividualesDtoRequest`):

| Parámetro | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `codigo_participante` | string | No | Misma normalización y formato que en el POST. Si se envía y no corresponde a un `ESTUDIANTE`, 404. |
| `solo_vigentes` | boolean | No (`false`) | Solo acepta `true` o `false` (texto). Con `true` filtra por la regla de vigencia (ver Reglas). |
| `offset` | entero | No (`0`) | Entero `>= 0`. |
| `limit` | entero | No (`20`) | Entero de 1 a 100. |

`offset` y `limit` aceptan solo dígitos (`^\d+$`); cualquier otro texto es 400. `whitelist` + `forbidNonWhitelisted`: cualquier parámetro que no esté en la tabla da 400 `PARAMETRO_INVALIDO`. Un `codigo_participante` vacío (`?codigo_participante=`) también es 400: no se trata como ausente. `offset` no tiene tope superior; un valor fuera del rango de la base probablemente termina en 500 `ERROR_PERSISTENCIA_PERMISOS` (límite conocido, sin verificar).

### `GET /admin/permisos-individuales/beneficiarios`

Query (`ListarBeneficiariosPermisoDtoRequest`): `offset` (entero `>= 0`, `0` por defecto) y `limit` (1 a 100, `20` por defecto). No hay búsqueda por texto ni más parámetros: cualquier otro es 400.

### `POST /admin/permisos-individuales/:id_permiso/revocar`

Sin body. `:id_permiso` debe ser UUID (`ParseUUIDPipe`); si no, 400 `PARAMETRO_INVALIDO`.

## Respuesta

### 201 · `POST /admin/permisos-individuales`

`PermisoOtorgadoDtoResponse`. **No** incluye `id_usuario_beneficiario`, `correo_beneficiario` ni `revocado_en`.

```json
{
  "id_permiso": "00000000-0000-4000-8000-0000000000a1",
  "codigo_participante": "P-0A1B2C3D",
  "alcance": "ACCESO_INDIVIDUAL",
  "fecha_inicio_vigencia": "2026-11-26T15:00:00.000Z",
  "fecha_fin_vigencia": "2027-03-01T00:00:00.000Z",
  "vigente": true
}
```

`fecha_fin_vigencia` es `null` si no se envió. `vigente` es siempre `true` en el 201 (recién otorgado, con fin futuro validado).

### 200 · `GET /admin/permisos-individuales`

```json
{
  "items": [
    {
      "id_permiso": "00000000-0000-4000-8000-0000000000a1",
      "codigo_participante": "P-0A1B2C3D",
      "alcance": "ACCESO_INDIVIDUAL",
      "fecha_inicio_vigencia": "2026-11-26T15:00:00.000Z",
      "fecha_fin_vigencia": null,
      "vigente": true,
      "id_usuario_beneficiario": "00000000-0000-4000-8000-000000000001",
      "correo_beneficiario": "admin@ejemplo.test",
      "revocado_en": null
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 20
}
```

- Cada elemento es `PermisoListadoDtoResponse`: los campos del 201 más `id_usuario_beneficiario`, `correo_beneficiario` (nuevo, ver más abajo) y `revocado_en` (`string | null`).
- `total` es el número de permisos que cumplen el filtro (sin paginar); `offset` y `limit` repiten lo aplicado.
- Orden: `fecha_creacion DESC, id_permiso`.
- Un participante que existe y no tiene permisos da 200 con `items: []` y `total: 0`.
- `vigente` se calcula con la hora de la base (`now()`); es `false` si está revocado, vencido o aún no empieza.

### 200 · `GET /admin/permisos-individuales/beneficiarios` (nuevo)

```json
{
  "items": [
    { "id_usuario": "00000000-0000-4000-8000-000000000001", "correo_electronico": "admin@ejemplo.test" }
  ],
  "total": 1,
  "offset": 0,
  "limit": 20
}
```

- Solo usuarios con `rol = ADMINISTRATIVO` y `estado_cuenta = ACTIVA`. No salen estudiantes, coordinadores, cuentas `PENDIENTE_ACTIVACION` ni `BLOQUEADA`.
- Solo `id_usuario` y `correo_electronico` (`select` explícito en `tx.usuarios.findMany`; nunca `contrasena_hash` ni otros campos).
- Orden estable: `correo_electronico` ascendente. `total` cuenta todos los que cumplen el criterio.

### 200 · `POST /admin/permisos-individuales/:id_permiso/revocar`

```json
{
  "id_permiso": "00000000-0000-4000-8000-0000000000a1",
  "vigente": false,
  "revocado_en": "2026-11-26T16:30:00.000Z"
}
```

## Etiqueta del beneficiario

La base **no tiene nombre** del usuario administrativo (`usuario.usuarios` solo trae `correo_electronico`, `rol`, `estado_cuenta`, etc.). Por decisión de Sebastián (2026-11-25, D7 del brief), la etiqueta del beneficiario es su **correo electrónico**:

- `GET .../beneficiarios` devuelve `{ id_usuario, correo_electronico }`.
- `GET /admin/permisos-individuales` devuelve `correo_beneficiario` en cada elemento (el `correo_electronico` del usuario `id_usuario_beneficiario`, obtenido en la misma consulta con un `JOIN`, sin N+1).
- Los nombres son una posible tarea futura del backend (requiere una columna y una migración, fuera de alcance). Si se crea, se agregará `nombre` junto a los campos actuales, sin quitar ni renombrar nada.

## Errores

Sobre de error: `{ "status": <HTTP>, "codigo": "<CODIGO>", "mensaje": "<texto>" }`. El campo de texto se llama `mensaje` (convención abierta A-020: el filtro de dominio de otros módulos usa `message`).

| HTTP | `codigo` | Endpoints | Caso y `mensaje` |
| --- | --- | --- | --- |
| 400 | `PARAMETRO_INVALIDO` | Los 4 | Cuerpo, query o `:id_permiso` inválidos. «Los parámetros de la operación no son válidos.» Mensaje fijo, sin repetir lo enviado ni indicar el campo. |
| 404 | `PARTICIPANTE_NO_ENCONTRADO` | POST y GET con `codigo_participante` | El código no existe o no pertenece a un `ESTUDIANTE`. «El participante seleccionado no existe.» |
| 404 | `PERMISO_NO_ENCONTRADO` | Revocar | No existe el permiso. «El permiso solicitado no existe.» |
| 409 | `PERMISO_YA_VIGENTE` | POST | Ya hay un permiso abierto para el mismo beneficiario, participante y alcance (índice único parcial). «Ya existe un permiso vigente con ese alcance.» |
| 409 | `PERMISO_YA_REVOCADO` | Revocar | El permiso ya tiene `revocado_en`. «El permiso ya fue revocado.» |
| 422 | `AUTOCONCESION_NO_PERMITIDA` | POST | `id_usuario_beneficiario` es el usuario de la sesión. «No puede concederse permisos a sí mismo.» |
| 422 | `ROL_INVALIDO_PARA_OPERACION` | POST | El trigger de la base rechaza los roles (beneficiario distinto de `ADMINISTRATIVO`, participante distinto de `ESTUDIANTE`, u otorgante distinto de `COORDINADOR_PSI`; un UUID de beneficiario que no existe también cae aquí, porque el trigger corre antes de la clave foránea). «El usuario indicado no tiene un rol válido para esta operación.» |
| 422 | `VIGENCIA_INVALIDA` | POST | `fecha_fin_vigencia` no es posterior al momento actual (o la restricción `ck_permiso_vigencia` de la base). «La fecha de fin de vigencia debe ser posterior al momento actual.» |
| 500 | `ERROR_PERSISTENCIA_PERMISOS` | Los 4 | Cualquier otro fallo de base o de auditoría; se revierte la transacción. «No fue posible completar la operación sobre el permiso individual.» |

Ejemplo:

```json
{ "status": 404, "codigo": "PARTICIPANTE_NO_ENCONTRADO", "mensaje": "El participante seleccionado no existe." }
```

### Orden de las comprobaciones al conceder (POST)

1. Validación del cuerpo (pipe) → 400.
2. Autoconcesión (`id_usuario_beneficiario` = sesión) → 422 `AUTOCONCESION_NO_PERMITIDA`.
3. Vigencia (`fecha_fin_vigencia` futura) → 422 `VIGENCIA_INVALIDA`.
4. Participante (existe y es `ESTUDIANTE`) → 404 `PARTICIPANTE_NO_ENCONTRADO`.
5. Cierre de permisos vencidos sin revocar de la misma combinación (`administrativo.fn_cerrar_permisos_vencidos`, con su registro en bitácora).
6. `INSERT`: el trigger `trg_permiso_reglas` valida roles (422 `ROL_INVALIDO_PARA_OPERACION`) y el índice único parcial `uq_permiso_individual_no_revocado` rechaza el duplicado (409 `PERMISO_YA_VIGENTE`).

Como todo ocurre dentro de la transacción de auditoría, cualquier error revierte también el cierre de vencidos.

La autoconcesión del paso 2 se compara como texto, distinguiendo mayúsculas: si el UUID del beneficiario llega con otra capitalización que el de la sesión, el paso 2 no lo detecta y puede salir antes `VIGENCIA_INVALIDA` o `PARTICIPANTE_NO_ENCONTRADO`; si no, el trigger lo rechaza en el paso 6 con el mismo 422 `AUTOCONCESION_NO_PERMITIDA`. Los UUID que devuelve el backend salen en minúsculas.

## Reglas y decisiones

- **Vigencia.** Un permiso está vigente si `revocado_en IS NULL`, `fecha_inicio_vigencia <= now()` y (`fecha_fin_vigencia IS NULL` o `> now()`). La misma regla (`fn_permiso_individual_vigente`) la usa el guard y `solo_vigentes`.
- **Revocar un permiso vencido pero no revocado responde 200.** Solo se rechaza con 409 `PERMISO_YA_REVOCADO` si ya tiene `revocado_en`. Un permiso vencido y sin revocar sigue siendo revocable.
- **Estado de la cuenta del beneficiario.** El POST **no** comprueba `estado_cuenta` del beneficiario: el trigger solo mira `rol`, así que acepta a un `ADMINISTRATIVO` con cuenta `BLOQUEADA` o `PENDIENTE_ACTIVACION`. `GET .../beneficiarios` solo ofrece cuentas `ACTIVA`, y la interfaz solo ofrece lo que ese endpoint devuelve. Exigir cuenta activa en el POST sería un cambio del backend fuera de BE-336.
- **Participante identificado por código.** El `codigo_participante` (seudónimo, tabla `administrativo.seudonimos_participante`) nunca expone el correo ni el UUID del estudiante.
- **GET con `codigo_participante`.** Si el código no existe o no es de un `ESTUDIANTE`: 404 y la consulta queda `FALLIDA` en la bitácora. Si existe: se filtra por él. **Sin `codigo_participante`, el GET sigue siendo el listado global**, sin comprobación de existencia.
- **Reglas en la base** (migraciones `20261125120000_usuario_rol_coordinador_psi` y `20261125120100_administrativo_permisos_individuales`): el enum `rol_enum` acepta `COORDINADOR_PSI`; el trigger `fn_permiso_individual_reglas` impone otorgante `COORDINADOR_PSI`, beneficiario `ADMINISTRATIVO`, participante `ESTUDIANTE` y no autoconcesión (SQLSTATE `AD422`), y que un permiso revocado no se vuelva a revocar (`AD409`); `trg_permiso_exige_bitacora` exige el registro en bitácora en la misma transacción. Este PR **no agrega migraciones**.
- **Auditoría (RF-122, RF-123).** Cada consulta del listado de permisos y de beneficiarios registra `ACCESO_MODULO` sobre `PERMISOS_INDIVIDUALES` en la bitácora (también al abrir el formulario, que consulta beneficiarios). Si la consulta falla (por ejemplo, el 404 del GET), queda `FALLIDA`. Conceder y revocar registran `GESTION_PERMISO_INDIVIDUAL` con severidad `ALTA`, en la misma transacción. Los 400 de validación ocurren antes del caso de uso y no se registran.
- **Lectura de `usuario.usuarios` desde `administrativo`.** El listado de beneficiarios (`findMany` y `count` de Prisma) y el `JOIN` del correo en el listado leen la tabla del módulo `usuarios`. No existe un puerto de `usuarios` que sirva (`buscarPorTermino` filtra `ESTUDIANTE` fijo), así que se acepta como precedente, igual que `buscarIdParticipante` y `cronograma` (enmienda E6).
- `/usuarios/buscar` y `crear/administrativo` **no cambian**.

## Comportamientos que este contrato no cubre

Se dejan escritos porque corregirlos exige tocar código global (`main.ts`, filtros o guardas compartidas), fuera del alcance de BE-336 (A-075, enmienda E3):

- **JSON mal formado y 413.** Un cuerpo que no es JSON válido (`entity.parse.failed`) o que excede el tamaño permitido lo rechaza el parser de Express antes de llegar al controlador, así que no pasa por `SolicitudInvalidaPermisosFilter`. Salen con el sobre por defecto de Nest: `{ "statusCode": 400 | 413, "message": "...", "error": "..." }`, sin `codigo`. A diferencia del filtro, el `message` del parser puede repetir un fragmento del cuerpo enviado (según la versión de Node, `JSON.parse` lo incluye).
- **401 y 403 de las guardas** de sesión, alcance, rol y CSRF siguen con su sobre actual, sin `codigo`:
  - 401 `SessionAuthGuard`: «No existe una sesión activa. Por favor, inicie sesión nuevamente.»
  - 403 `SessionScopeGuard`: «La sesión actual no tiene alcance para acceder a esta funcionalidad.»
  - 403 `RolesGuard`: «No tienes permisos para realizar esta acción.»
  - 403 `CsrfSessionGuard`: «La solicitud no contiene un token CSRF válido para la sesión.»
  - 500 `SessionAuthGuard` (`InternalServerErrorException`): «Error en la configuración de roles del usuario. Contacte al administrador del sistema.»
  - El frontend debe tratarlos por su HTTP y mostrar un texto genérico (ADR-0004), no por `codigo`.
- **403 de las consultas individuales** (`PermisoIndividualGuard`, RF-128 a RF-131 y RF-145): no pertenece a este contrato. Hoy el guard devuelve `{ "status": 403, "codigo": "SIN_PERMISO_INDIVIDUAL", "mensaje": "No tiene autorización para consultar información individual del usuario." }`; cada endpoint puede sustituir el `mensaje` y el `codigo` con sus metadatos (`CODIGO_PERMISO_KEY`, `MENSAJE_PERMISO_KEY`). `COORDINADOR_PSI` pasa sin permiso. Qué `codigo` muestra la interfaz lo resuelve el frontend (D5 del brief); el backend no lo cambia aquí.

## Cambios de comportamiento respecto a develop

Lo aditivo: el endpoint `GET .../beneficiarios` y el campo `correo_beneficiario` en el GET. Lo que **no** es aditivo, con la razón de que no rompe a nadie:

| # | Antes (`develop`) | Ahora | Efecto |
| --- | --- | --- | --- |
| C1 | `GET` con `codigo_participante` inexistente: 200 con `items: []` | 404 `PARTICIPANTE_NO_ENCONTRADO`, igual que el POST | La interfaz distingue «sin permisos» de «código equivocado» (A-075). |
| C2 | Los 400 de validación salían con el sobre por defecto de Nest (`{ statusCode, message, error }`, texto en inglés y lista de campos) | `{ status: 400, codigo: "PARAMETRO_INVALIDO", mensaje }`, mensaje fijo en español, sin eco | Solo en este controlador; el `ValidationPipe` global y los demás módulos no cambian. |
| C3 | La consulta del GET con un código inexistente se registraba `EXITOSA` | Se registra `FALLIDA` (efecto de C1; aprobado en E5) | Solo cambia la bitácora. |

**Por qué no rompe a nadie:** ninguna pantalla consume todavía estas rutas (el PR 2 de FE-336, que las conecta, está esperando esta tarea). La capa `api/` del frontend ya existe y llama a las cuatro rutas de RF-04, pero está en la rama `feat/336-fe-permisos-acceso-individual` (PR #100, aún no mergeado) y ningún hook ni página la usa; sus comentarios y su demostración suponen el 200 con `items: []` del GET, y el PR 2 debe adaptarse al 404. Sin consumidores en producción, el cambio no necesita expandir-y-contraer. El 201 del POST no cambia.

## Trazabilidad

- RF cubiertos: RF-04 v1.0.1 (`requerimientos/M01_Gestion_de_Usuario.md#rf-04`, concesión y revocación por `COORDINADOR_PSI`). Soporte de las consultas que exigen el permiso: RF-128, RF-129, RF-130, RF-131 y RF-145 (`requerimientos/M08_Administrativo.md`, todos v1.0.0 en el Excel convertido); auditoría de RF-122 y RF-123.
- HU de Taiga: #336 (M08). Briefs `BE-336` y `FE-336` en `_trabajo/HU-336_M08_permisos-acceso-individual/` (no versionados).
- Aclaraciones en `Brisa-Frontend/docs/specs/ACLARACIONES.md` (repositorio del frontend): A-074 (resuelta: quién recibe el permiso), A-075 (contrato del backend: 404 del GET, sobre del 400 y lo que no se cubre), A-076 (listado de beneficiarios y etiqueta), A-077 (cómo se crea el primer `COORDINADOR_PSI`, fuera de alcance), A-078 (`docker-compose.yaml`, fuera de alcance). A-020 sigue abierta (`mensaje` frente a `message`).
- Rama `feat/336-be-permisos-integracion`; commits: `06764be` (sobre del 400), `30ff2d2` (404 del GET), `20c6417` (`correo_beneficiario`), `b7b4362` (endpoint de beneficiarios) y el commit de este contrato con su fila en el registro del SDD §9. Pendiente de PR contra `develop`.
- Código: `src/modules/administrativo/presentation/controllers/permisos-individuales/permisos-individuales.controller.ts`, `presentation/filters/solicitud-invalida-permisos.filter.ts`, `application/use-cases/permisos-individuales/`, `application/dto/permisos-individuales/`, `application/exceptions/permiso-individual.exception.ts` e `infrastructure/persistence/prisma-permisos-individuales.repository.ts`. Pruebas unitarias y `*.controller.http.spec.ts` en la misma rama; el e2e de RF-04 (`test/administrativo/permisos-individuales-rf04.e2e-spec.ts`) exige base local y no se ejecutó.
- Contrato de referencia de formato: [CONTRATO_RF125_PARTICIPANTES_COHORTE.md](CONTRATO_RF125_PARTICIPANTES_COHORTE.md).
