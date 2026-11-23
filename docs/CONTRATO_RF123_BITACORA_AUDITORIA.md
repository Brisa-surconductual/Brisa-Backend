# RF-123 — Bitácora de auditoría administrativa

El SSD define la arquitectura y el Excel «Especificacion Requerimientos (1)» contiene RF-123 en la hoja «MO8- Administrativo», filas 30 a 56. La consulta posterior que menciona el RF se implementa mediante `GET /administrativo/auditoria`.

## Consulta HTTP

Requiere cookie de una sesión activa, alcance `COMPLETA` y rol `ADMINISTRATIVO`, que es el rol administrativo disponible en el backend. Responde con `{ data, meta: { hay_mas, siguiente_cursor } }`. `limite` acepta valores de 1 a 100 y por defecto es 20. `antes_de` acepta el UUID de `siguiente_cursor`. El orden es descendente por marca temporal e identificador. Una consulta registra su propio acceso después de seleccionar las filas, dentro de la misma transacción.

Cada entrada de `data` incluye `id_auditoria`, `accion`, `recurso_afectado`, `id_recurso`, `direccion_ip`, `marca_temporal` y `estado_accion`. El actor y la sesión se persisten para trazabilidad interna. La IP se obtiene de Express con la configuración existente de `TRUST_PROXY`. En un intento sin identidad válida se conservan los campos disponibles. La respuesta prohíbe la caché. El adaptador del frontend puede mapear `accion` a `action` y seguir mostrando únicamente los campos aprobados para su vista.

| HTTP | Condición                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------- |
| 200  | Consulta completada y auditada                                                                       |
| 400  | Parámetros de listado inválidos                                                                      |
| 401  | Sesión no autenticada                                                                                |
| 403  | Rol o alcance insuficiente (`ACCESO_DENEGADO`)                                                       |
| 500  | Fallo en la consulta o registro. Un fallo al registrar devuelve `ERROR_REGISTRO_AUDITORIA` sin datos |

## Integración de acciones

`AuditoriaService.registrar(ctx, evento, { modo: 'SINCRONO', tx })` escribe en la transacción de Prisma que recibe. `AuditoriaService.ejecutar` ejecuta una operación y su registro exitoso en una sola transacción. Si falla, revierte y registra `FALLIDA` en otra transacción cuando PostgreSQL está disponible. Esta operación se usa para la bitácora y queda disponible para consultas de participantes, exportaciones y cambios de umbrales de M08. El endpoint que exporte debe entregar sus datos o iniciar la descarga después de que `ejecutar` confirme la transacción.

Para el modo `DIFERIDO`, el servicio preasigna `id_auditoria`, que se usa como identificador de trabajo de `auditoria-diferida` y como clave primaria de la fila. PostgreSQL conserva una única fila incluso si el trabajo se procesa de nuevo. BullMQ realiza el intento inicial y hasta cinco reintentos con backoff exponencial de un segundo inicial. El modo diferido requiere `AUDITORIA_REDIS_URL`.

La implementación reutiliza la tabla `administrativo.bitacora_auditoria`. La migración aplica el bloqueo existente a la sentencia completa de `UPDATE` o `DELETE`, incluso si el filtro no encuentra filas. La protección de `TRUNCATE` ya existe.
