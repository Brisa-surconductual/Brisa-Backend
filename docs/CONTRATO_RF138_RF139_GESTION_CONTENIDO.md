# RF-138 y RF-139 — Banco de mensajes y contenido narrativo

M-8 recibe solicitudes REST con la sesión administrativa completa y aplica la protección CSRF a las escrituras. Las rutas usan los roles administrativos que el módulo reconoce, `ADMINISTRATIVO` y `COORDINADOR_PSI`. El identificador del actor de cada cambio procede de la sesión.

## RF-138

| Método | Ruta bajo `/admin/notificaciones` | Respuesta |
| --- | --- | --- |
| GET | `/mensajes` | `200` con `items`, `total`, `offset`, `limit` |
| POST | `/mensajes` | `201` con `id_mensaje` y estado `BORRADOR` |
| PATCH | `/mensajes/:id_mensaje` | `200` con identificador y estado |
| POST | `/mensajes/:id_mensaje/activar` | `200` con estado `ACTIVO` o `400 TERMINOS_RESTRINGIDOS` con `terminos_detectados` |
| POST | `/mensajes/:id_mensaje/inactivar` | `200` con estado `INACTIVO` |
| GET, PUT | `/terminos-restringidos` | `200` con términos, fecha de actualización y `aplica_retroactivamente: false` |

`MensajesNotificacionPort` permite conectar RF-84 y RF-85. Su operación de activación exige validar la lista vigente y cambiar el estado de forma atómica en M-7. El cambio de la lista se aplica a validaciones futuras. El listado acepta filtros de tipo y estado. Usa `offset=0` y `limit=20` por defecto, con un máximo de 100 por petición.

## RF-139

| Método | Ruta bajo `/admin/narrativa` | Respuesta |
| --- | --- | --- |
| GET | `/capitulos`, `/logros` | `200` con `items` |
| POST | `/capitulos`, `/logros` | `201` con el identificador y estado `BORRADOR` |
| PATCH | `/capitulos/:id_capitulo`, `/logros/:id_logro` | `200` con identificador y estado |
| POST | `/capitulos/:id_capitulo/publicar`, `/capitulos/:id_capitulo/inactivar` | `200` con identificador y estado |
| POST | `/logros/:id_logro/activar`, `/logros/:id_logro/inactivar` | `200` con identificador y estado |
| PUT | `/reglas-nivel/:nivel_gamificacion` | `200` con nivel, requisitos y estado |
| GET | `/cobertura` | `200` con totales y capítulos pendientes |

`ContenidoNarrativoPort` conecta RF-105, RF-114 y RF-115. M-6 protege los capítulos completados y valida unidad temporal, referencias y recursos visuales. M-8 conserva el `409 CAPITULO_EN_USO` y los `422 CAPITULO_SIN_UNIDAD_TEMPORAL`, `REFERENCIA_NARRATIVA_INVALIDA` y `RECURSO_VISUAL_INVALIDO`. La cobertura es una consulta informativa. El panel puede actualizarla con el GET después de una escritura. El bloqueo por cobertura corresponde a RF-151.

## Auditoría y dependencias

Cada cambio confirmado registra `GESTION_MENSAJES_NOTIFICACION` o `GESTION_CONTENIDO_NARRATIVO` en RF-123. `detalle.accion_solicitada` conserva la acción REST. Incluye la justificación cuando se envía. La cola existente reintenta la persistencia. Si el envío inicial a Redis falla, el backend conserva el resultado del cambio y reintenta en segundo plano con el mismo UUID, con respaldo idempotente en PostgreSQL. Los reintentos de ese envío inicial duran mientras el proceso sigue activo. El alta conserva el `201` acordado por el contrato REST durante el reintento. La advertencia queda en los logs.

Mientras no existan los proveedores de M-6 y M-7, cada ruta devuelve `503` con el código del módulo correspondiente. Los casos de prueba sustituyen estos proveedores para verificar ambos contratos.

El contrato REST recibido define la escritura de reglas de nivel y omite la consulta del catálogo que pide RF-139. Su ruta y respuesta quedan por definir. El ejemplo REST envía un UUID como `id_referencia` incluso para `FASE_ALCANZADA`, mientras RF-105 identifica la fase por enum. El contrato HTTP conserva el UUID del ejemplo y el mapeo debe acordarse al conectar M-6. También queda por definir el permiso específico de gestión de cada catálogo si RF-04 requiere distinguirlo de los roles administrativos vigentes.
