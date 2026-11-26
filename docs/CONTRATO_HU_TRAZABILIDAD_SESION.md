# Trazabilidad de una sesión conversacional (auditoría, solo lectura)

## Estado

BORRADOR (`feat/chat-trazabilidad-sesion`; ampliación para M-8 en `feat/m03-rf38-trazabilidad-admin-juan`).

## Historia

Como usuario administrativo del equipo de psicología, quiero consultar la secuencia completa de nodos, respuestas y transiciones de una sesión conversacional, sin poder modificarla, para auditar el proceso de intervención.

RF-38 pide reconstruir la secuencia «dentro de una sesión o entre sesiones» y restringe el acceso a módulos internos autorizados y al rol administrativo. Las secciones marcadas **Ampliación para M-8** no son requisitos nuevos de RF-38: son lo que necesita la interfaz administrativa (M-8) para usarlo (encontrar las sesiones de un participante y entender qué se le presentó).

## Operación y acceso

- **Puerto interno para M-8:** `TrazabilidadPort.obtenerSesion(id_sesion)` (`application/ports/trazabilidad-sesion.port.ts`), exportado por `ChatModule`. Devuelve el mismo DTO ampliado que el endpoint.
- **HTTP:**
  - `GET /chat/admin/sesiones/{id_sesion}/trazabilidad` (existente; ampliado).
  - `GET /chat/admin/participantes/{codigo_participante}/sesiones` (**Ampliación para M-8**).
- Ambos: rol `ADMINISTRATIVO` con sesión completa (`@AccesoAdministrativoAuditado(...)`: los mismos guards que `@AccesoAdministrativo()` más la auditoría de RF-123), solo lectura (sin CSRF), `Cache-Control: no-store` y envoltura `{ data }`. No existe ninguna operación de escritura (POST, PUT, PATCH y DELETE responden 404).
- Cada consulta HTTP se registra en la bitácora administrativa (ver «Auditoría de consultas (RF-123)»). El puerto interno `TrazabilidadPort` no se audita: lo usan módulos, no un usuario administrativo.

## 1. Trazabilidad de una sesión

`GET /chat/admin/sesiones/{id_sesion}/trazabilidad[?codigo_participante=P-XXXXXXXX]`

### Respuesta 200

```json
{
  "data": {
    "id_sesion": "00000000-0000-4000-8000-000000000001",
    "id_participante": "P-1A2B3C4D",
    "registros": [
      {
        "secuencia": 1,
        "id_nodo": "00000000-0000-4000-8000-00000000000a",
        "respuesta_usuario": { "valor": "si" },
        "id_nodo_destino": "00000000-0000-4000-8000-00000000000b",
        "timestamp_interaccion": "2026-11-20T14:00:00.000Z",
        "tipo_entrada": "OPCION_UNICA",
        "contenido_historico": "VERIFICADO",
        "motivo_no_verificable": null,
        "tipo_nodo": "PREGUNTA",
        "texto_nodo": "¿Dormiste bien?",
        "etiqueta_respuesta": "Sí, bien"
      },
      {
        "secuencia": 2,
        "id_nodo": "00000000-0000-4000-8000-00000000000b",
        "respuesta_usuario": { "valor": null },
        "id_nodo_destino": null,
        "timestamp_interaccion": "2026-11-20T14:01:00.000Z",
        "tipo_entrada": "CONTINUAR",
        "contenido_historico": "NO_VERIFICABLE",
        "motivo_no_verificable": "NODO_MODIFICADO_TRAS_PUBLICACION",
        "tipo_nodo": null,
        "texto_nodo": null,
        "etiqueta_respuesta": null
      }
    ]
  }
}
```

### Campos existentes (sin cambios)

- `registros` trae todas las interacciones de la sesión en orden ascendente de `secuencia`, sin paginar.
- `respuesta_usuario.valor` es el valor guardado sin modificar (RF-27): número, booleano, texto, arreglo u objeto. `CONTINUAR` lleva `null`.
- `id_nodo_destino` es `null` cuando el registro es el fin del flujo, es decir, una fila de `historial_nodos` sin destino.
- `id_participante` es el seudónimo del participante (A7). Se obtiene con `administrativo.fn_obtener_codigo_participante`, la misma función que usa M-8, que lo crea si el participante aún no tiene uno. Nunca se expone el UUID del estudiante.
- Una sesión sin interacciones responde 200 con `registros: []`.

### Ampliación para M-8: campos descriptivos por registro

Son aditivos: ningún campo existente cambia de nombre, tipo ni significado.

| Campo | Tipo | Significado |
| --- | --- | --- |
| `tipo_entrada` | string | Tipo de entrada guardado con la respuesta (dato persistido; siempre presente). Los alias históricos `SELECCION_UNICA` y `SELECCION_MULTIPLE` se presentan como `OPCION_UNICA` y `MULTISELECCION`, igual que RF-31. |
| `contenido_historico` | `VERIFICADO` \| `NO_VERIFICABLE` | Si los tres campos siguientes son, con garantías, el contenido de la versión que vio el participante. |
| `motivo_no_verificable` | string \| null | `null` si es `VERIFICADO`; si no, uno de los motivos de abajo. |
| `tipo_nodo` | string \| null | Tipo del nodo (p. ej. `PREGUNTA`, `MENSAJE`). `null` si no es verificable. |
| `texto_nodo` | string \| null | Textos del nodo (bloques de texto e instrucciones del JSON del nodo), unidos por una línea en blanco. `null` si no es verificable o si el nodo no tiene texto (solo multimedia). |
| `etiqueta_respuesta` | string \| string[] \| null | Etiqueta de la opción elegida (`OPCION_UNICA`) o lista de etiquetas (`MULTISELECCION`), tomadas de las opciones del nodo verificado. `null` si el tipo no tiene opciones, si no es verificable o si algún valor no tiene etiqueta (nunca se completa una lista parcial). **No reemplaza** `respuesta_usuario.valor`, que se conserva siempre. |

Motivos de `NO_VERIFICABLE` (los campos descriptivos son `null` en todos):

| Motivo | Cuándo |
| --- | --- |
| `NODO_NO_DISPONIBLE` | El nodo ya no existe. |
| `NODO_FUERA_DE_VERSION` | El nodo no pertenece al flujo de la sesión. |
| `VERSION_NO_PUBLICADA` | El flujo de la sesión no es la versión `version_arbol_utilizada`, sigue en `BORRADOR` o no tiene `fecha_publicacion`. |
| `NODO_MODIFICADO_TRAS_PUBLICACION` | `nodos.fecha_actualizacion` es posterior a la publicación de la versión. |
| `CONTENIDO_EXTERNO_NO_VERSIONADO` | El nodo no tiene bloques ni multimedia propios y su texto se completa con un contenido externo (`id_contenido`, RF-152), que puede cambiar después. |
| `CONTENIDO_NO_INTERPRETABLE` | El JSON guardado del nodo no se puede interpretar. |

### Fidelidad histórica: garantías y límites

- **Cómo se versiona:** cada fila de `chat.flujo_conversacion` es una versión (`uq_flujo_id_version`); una versión nueva clona sus nodos con identificadores nuevos (RF-25C), y `chat.sesiones` guarda `id_flujo_conversacional` y `version_arbol_utilizada`. Por eso un `id_nodo` del historial identifica el nodo de esa versión.
- **Cuándo es verificable:** el nodo pertenece al flujo de la sesión, ese flujo es la versión registrada y está `PUBLICADO` o `ARCHIVADO` con `fecha_publicacion`, y el nodo no se actualizó después de la publicación. El dominio impide editar nodos de un flujo que dejó de ser borrador (`FlujoConversacionalNoEditableException`); cada edición permitida actualiza `fecha_actualizacion` y queda en `chat.auditoria_arboles`, que es inmutable.
- **Qué no se presenta:** contenido externo (RF-152) ni recursos multimedia. No se firman URL ni se consulta almacenamiento: el contenido externo puede cambiar y una URL firmada nueva no prueba lo que se vio.
- **Límite conocido:** la base de datos impide borrar un flujo publicado (`trg_bloquear_borrado_flujo_publicado`), pero **no impide actualizar** las filas de `chat.nodos` de un flujo publicado. Una modificación hecha directamente por SQL que no cambie `fecha_actualizacion` no sería detectable, y `VERIFICADO` mostraría el texto modificado. La garantía depende de que toda edición pase por la aplicación.
- **Recomendación futura (no implementada por decisión del proyecto):** un trigger `BEFORE UPDATE OR DELETE` sobre `chat.nodos` (y sobre las reglas de transición) que rechace cambios cuando el flujo del nodo no esté en `BORRADOR`, análogo a `trg_bitacora_inmutable`. Es un cambio de esquema con migración; se decidió no incluirlo por ahora, así que el límite anterior sigue vigente.
- **Lectura:** el historial se lee en una transacción `RepeatableRead` (sin cambios). Los nodos y el flujo se leen después, fuera de esa transacción; es aceptable porque el contenido de una versión publicada no cambia.

### Parámetro `codigo_participante` (Ampliación para M-8)

Opcional. Si se envía, la sesión debe pertenecer a ese participante; si no le pertenece o el código no existe, responde **404 `SESION_NO_ENCONTRADA`**, igual que una sesión inexistente (no confirma ninguna asociación). Así M-8 puede abrir la trazabilidad desde la ficha de un participante sin mostrar una sesión ajena. Se valida con el formato A7 y se normaliza a mayúscula; otro formato (incluido un UUID) responde 400.

## 2. Sesiones de un participante (Ampliación para M-8)

`GET /chat/admin/participantes/{codigo_participante}/sesiones?limite=20&cursor=...`

### Parámetros

| Parámetro | Dónde | Regla |
| --- | --- | --- |
| `codigo_participante` | ruta | Seudónimo A7: `P-` y 8 hexadecimales (`/^P-[0-9A-F]{8}$/`, se acepta en minúscula y se normaliza). Un UUID interno del estudiante **no** se acepta. |
| `limite` | consulta | Entero de 1 a 50. Por defecto 20. |
| `cursor` | consulta | Opcional. El valor de `siguiente_cursor` de la página anterior (base64url, opaco). |

Cualquier otro parámetro (p. ej. `include_pii`) responde 400.

### Respuesta 200

```json
{
  "data": {
    "id_participante": "P-1A2B3C4D",
    "items": [
      {
        "id_sesion": "00000000-0000-4000-8000-000000000001",
        "modalidad": "GRUPAL",
        "estado": "COMPLETADA",
        "fecha_inicio": "2026-11-20T14:00:00.000Z",
        "fecha_ultima_interaccion": "2026-11-20T14:20:00.000Z"
      }
    ],
    "total": 1,
    "siguiente_cursor": null
  }
}
```

- `modalidad` y `estado` usan los valores del dominio (`GRUPAL`, `PERSONALIZADA`, `SOS`; `ACTIVA`, `PAUSADA`, `COMPLETADA`, `ERROR_CONFIGURACION`). Se incluyen las sesiones SOS.
- Orden: `fecha_ultima_interaccion` descendente y, a igualdad, `id_sesion` descendente (determinista).
- `total` es el número de sesiones del participante sin paginar. Solo cuentan sesiones con estado registrado (`chat.estado_sesiones`), igual que la lectura por id.
- Un participante sin sesiones responde 200 con `items: []`, `total: 0`.
- No se devuelve nombre, correo, documento, perfil clínico ni el UUID del estudiante.

### Paginación

Por conjunto (keyset) sobre `(fecha_ultima_interaccion, id_sesion)`, estable aunque se creen sesiones nuevas mientras se pagina. El cursor lleva solo la posición de la última sesión entregada, con la marca temporal a la precisión de la BD (microsegundos), porque `Date` de JavaScript la trunca a milisegundos y el cursor podría saltar o repetir sesiones. Página y total se leen en la misma transacción `RepeatableRead`. Un cursor alterado responde 400.

### Resolución del seudónimo y aislamiento

- El código se resuelve leyendo `administrativo.seudonimos_participante` por `codigo_participante` (índice único `uq_seudonimo_codigo`). **No** se usa `fn_obtener_codigo_participante`: esa función no es inversa, sino que obtiene o **crea** el código de un `id_usuario`. Este endpoint nunca crea seudónimos.
- Las sesiones se filtran por el `id_usuario` resuelto, y el caso de uso rechaza (500) cualquier página que contenga una sesión de otro usuario.
- **Correspondencia con M-8:** la referencia opaca que el frontend usa hoy en la ficha individual (RF-128, p. ej. `seg-…`) **no** es el código A7. M-8 debe obtener el código A7 del participante desde su propia fuente (la ficha o `administrativo.seudonimos_participante` a través del backend de M-8) y usarlo en este endpoint y en `codigo_participante`.

## Errores

| HTTP | `codigo` | Caso |
| --- | --- | --- |
| 400 | `PARAMETRO_INVALIDO` | `id_sesion` no es un UUID; `codigo_participante` sin formato A7; `limite` fuera de 1 a 50; `cursor` alterado; parámetro desconocido. |
| 401 | `NO_AUTENTICADO` | Sin sesión. |
| 403 | `NO_AUTORIZADO` | Sesión incompleta o rol distinto de `ADMINISTRATIVO`. |
| 404 | `SESION_NO_ENCONTRADA` | La sesión no existe, o no pertenece al `codigo_participante` indicado. |
| 404 | `PARTICIPANTE_NO_ENCONTRADO` | Ningún participante tiene ese seudónimo (listado). |
| 422 | `HISTORIAL_INCONSISTENTE` | El historial no supera `chat.fn_validar_historial_sesion`, o a una interacción le falta la respuesta válida o un destino comprobable (igual que RF-31). |
| 500 | sin código (mensaje genérico) | No se pudo registrar la consulta exitosa en la bitácora (RF-123): la consulta se bloquea y no se entrega ningún dato. También si falta el actor (usuario, sesión de autenticación o IP). |

## Autorización y auditoría

### Permisos: solo rol `ADMINISTRATIVO`

- **Política vigente:** cualquier usuario `ADMINISTRATIVO` con sesión completa puede consultar cualquier sesión y cualquier participante. No se exige un permiso individual.
- **Sustento documental** (`Especificacion Requerimientos.xlsx`):
  - RF-38: «El acceso al registro completo está restringido a módulos internos autorizados y al rol administrativo».
  - RF-04: permisos fijos asociados al rol; «no contempla la creación dinámica de roles, la asignación manual de permisos…».
  - RF-122: valida identidad, rol y permisos de RF-03 y RF-04 antes de exponer datos.
  - El único requisito que exige un permiso explícito adicional es RF-130 (progresión narrativa, M-6), que corresponde al alcance `PROGRESION_NARRATIVA`, no a la trazabilidad del chat.
- **Pendiente de producto (sin implementar):** la tabla `administrativo.permisos_acceso_individual` define el alcance `ACCESO_INDIVIDUAL`, pero ningún requisito lo asocia a RF-38 ni a otra consulta. Si el equipo decide exigirlo, debe documentarse primero en la especificación y conciliarse con RF-04, que excluye la asignación manual de permisos. Entonces se aplicaría igual al listado y a la trazabilidad, con 403 y registro `DENEGADA`.

### Auditoría de consultas (RF-123)

Implementada con la función existente `administrativo.fn_registrar_auditoria` (migración M-8, sección 17.1, «funciones invocadas por el puerto de NestJS»). Sin tablas nuevas ni cambios de esquema; la inmutabilidad la dan `trg_bitacora_inmutable` y `trg_bitacora_no_truncate`.

| Columna | Valor |
| --- | --- |
| `id_usuario_administrativo` | `id_usuario` del solicitante autenticado, también si es un estudiante denegado (la migración no restringe el rol en la bitácora porque RF-122 exige registrar esos intentos). |
| `id_sesion` | Sesión de **autenticación** del solicitante (`usuario.sesiones.id_sesion`), como en `fn_asignar_participante`, `fn_autorizar_transicion` y `fn_atender_alerta`. **Nunca** la sesión conversacional consultada. |
| `accion` | `CONSULTA_PARTICIPANTE` (RF-123: «consulta de información de participantes»). |
| `recurso_afectado` | `trazabilidad_sesion_chat` o `sesiones_participante_chat`. |
| `id_recurso` | Trazabilidad: la `id_sesion` conversacional consultada, si es un UUID válido. Listado: `null`. |
| `id_participante` | `id_usuario` del participante consultado: el dueño de la sesión o el resuelto por el seudónimo (solo lectura, nunca lo crea). `null` si no se identifica o si la consulta fue denegada. |
| `direccion_ip` | `req.ip` de Express (respeta `TRUST_PROXY`); si no existe, la dirección del socket. |
| `estado_accion` | `EXITOSA`, `FALLIDA` o `DENEGADA`. |
| `severidad` | La de la función por defecto (`BAJA`): RF-123 no define severidades. |
| `detalle` | `{ operacion }` y, si no fue exitosa, `estado_http` y `codigo_resultado` (código público del catálogo o `null`). |
| `registrado_diferido` | `false` (síncrono). |

**Eventos:**

| Caso | Estado | Momento |
| --- | --- | --- |
| 200 | `EXITOSA` | Después de la lectura y **antes** de enviar la respuesta. |
| 400 (parámetros, cursor), 404, 422, 500 | `FALLIDA` | Antes de responder el error. RF-123: «registrar intentos… aunque la operación no se complete exitosamente». |
| 403 por rol o por sesión incompleta | `DENEGADA` | En el guard, antes del 403 y sin leer datos del participante. |
| 401 | No se registra | Ver pendientes. |

**Política de fallos (RF-123, flujo alterno «Fallo en registro de auditoría»):**

- Consulta exitosa: si no se puede registrar (bitácora caída, participante no identificable o actor incompleto), responde **500** y **no se entrega ningún dato**. El mensaje interno de RF-123 va solo al log.
- Consulta fallida o denegada: se devuelve el mismo error original; si el registro falla, solo queda constancia en el log. Esa respuesta no contiene datos de participantes.

**Privacidad:** la bitácora no recibe preguntas, respuestas, textos de nodos, etiquetas, contenido clínico, el seudónimo ni ninguna entrada del cliente sin validar (parámetros desconocidos, cursores o mensajes de validación). Ningún log incluye respuestas ni textos de los nodos.

**Separación (RNF de mantenibilidad de RF-123):** los casos de uso no conocen la auditoría. Las piezas son:

- `AuditoriaAdministrativaPort` y `PrismaAuditoriaAdministrativaAdapter` (`src/shared/`), reutilizables por otros módulos;
- `actorAuditoria` (`src/shared/presentation/http/`);
- `AuditarConsultaTrazabilidadService`;
- `AutorizacionAdministrativaAuditadaGuard`, que ejecuta sin cambios `SessionScopeGuard` y `RolesGuard`;
- `AuditoriaConsultaTrazabilidadInterceptor`.

### Pendientes de auditoría

- **401 (sin sesión válida):** RF-123 pide registrarlo «cuando sea técnicamente posible». Sin sesión no hay usuario ni sesión de autenticación, y registrar peticiones anónimas permitiría a cualquiera escribir sin límite en una tabla inmutable. Falta decidir si se registran (con `id_usuario_administrativo` nulo y `INTENTO_ACCESO_NO_AUTORIZADO`) y con qué limitación de frecuencia. Corresponde a RF-122 y conviene resolverlo en `SessionAuthGuard` para todo el backend.
- **`ACCESO_MODULO`:** RF-123 exige registrar cada acceso al módulo administrativo; es responsabilidad de M-8 (entrada al módulo), no de estas consultas.
- **Severidad:** RF-123 no la define para consultas; se usa la de la función.
- **Consulta de la bitácora:** fuera de alcance (M-8).

## Configuración y validación

- **Fuente de datos:** `chat.interacciones` + `chat.historial_nodos` + la respuesta válida (sin cambios), `chat.nodos` y `chat.flujo_conversacion` para el contenido, y `chat.sesiones` + `chat.estado_sesiones` para el listado.
- **Reutilización:** la lectura del historial de RF-31 (`PrismaHistorialInteraccionesRepository.consultarCompleta`, con su verificación de integridad), la carga de nodos por lote (`ArbolConversacionalRepository.buscarNodosPorIds`, una consulta para todos los nodos y otra para el flujo, sin N+1), la política de bloques (`BloquesNodoActual`) y la lectura de la entrada (`PrepararEntradaNodoActualService`). No se reutiliza `PresentarNodoActualService.presentarContenido`, porque firma URL y lee contenidos externos mutables.
- **Inmutabilidad:** la garantiza la BD (RF-38). Este feature no escribe en el esquema `chat`. Escrituras: el registro de auditoría en `administrativo.bitacora_auditoria` (vía `fn_registrar_auditoria`) y, desde la trazabilidad de una sesión (no desde el listado), la creación del seudónimo del participante en `administrativo.seudonimos_participante` si aún no lo tenía.
- El historial del estudiante (RF-31 y RF-32) no cambia: un destino nulo sigue siendo inconsistencia allí.
- Sin migración ni cambios de esquema.

## Trazabilidad

- RF-31 (historial completo para auditoría), RF-38 (inmutabilidad y reconstrucción entre sesiones), RF-27 (respuesta sin modificar), RF-25C (versionado de flujos), A7 (seudónimo), RF-123 (bitácora), RF-122 y RF-04 (acceso por rol).
- Módulos: M-3 (Chat) → M-8 (Administrativo).
- Pruebas:
  - unitarias:
    - `consultar-trazabilidad-sesion.use-case.spec.ts`: campos anteriores intactos, contenido verificado y no verificable, respuestas escalares y estructuradas, `codigo_participante` y solo lectura;
    - `describir-contenido-historico.service.spec.ts`: cada motivo, carga por lote y etiquetas;
    - `listar-sesiones-participante.use-case.spec.ts`, `cursor-sesiones-participante.spec.ts` y `prisma-sesiones-participante.spec.ts`;
    - `trazabilidad-sesion.http.spec.ts` y `sesiones-participante.http.spec.ts`: 200, 400, 401, 403 con rol estudiante y con sesión incompleta, 404, 422 y ausencia de escritura; auditoría `EXITOSA`, `FALLIDA` y `DENEGADA`, sesión de autenticación distinta de la conversacional, 500 sin datos si la bitácora falla, error original conservado, 401 sin registro y sin contenido sensible en la bitácora;
    - `auditar-consulta-trazabilidad.service.spec.ts`, `prisma-auditoria-administrativa.adapter.spec.ts` y `actor-auditoria.spec.ts`;
    - `consultarCompleta` en `prisma-historial-interacciones.repository.spec.ts`.
  - e2e: `test/chat/trazabilidad-sesion.e2e-spec.ts` con `TRAZABILIDAD_TEST_DATABASE_URL` (base local `brisa_traz_*`). Incluye contenido verificado, listado con aislamiento entre dos participantes, `codigo_participante` ajeno y seudónimo inexistente sin crearlo y registro real en la bitácora con rechazo de UPDATE. **No se ejecutó en esta rama**: no había una base aislada configurada.
