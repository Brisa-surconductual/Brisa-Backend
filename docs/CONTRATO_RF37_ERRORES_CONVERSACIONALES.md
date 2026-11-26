# RF-37 — Manejo de errores de la conversación

## Estado

IMPLEMENTADA en `feat/chat-manejo-errores-rf37` (#314). Depende de RF-31 y de la
recuperación de RF-32.

## Operación y acceso

- `POST /chat/errores-cliente` requiere cookie de estudiante con alcance completo
  y `X-CSRF-Token`.
- `X-Request-Id` es opcional. Se acepta un identificador de hasta 64 caracteres
  alfanuméricos, puntos, guiones y guiones bajos. Si falta o tiene otro formato,
  el backend genera un UUID. Los errores y los reportes devuelven el valor en la
  cabecera `X-Request-Id`.

## Request

| Campo | Tipo | Regla |
| --- | --- | --- |
| `codigo` | enum | Obligatorio. `ERROR_PRESENTACION`, `RECURSO_NO_DISPONIBLE` o `SIN_CONEXION`. |
| `id_sesion` | UUID | Opcional. La sesión debe pertenecer al estudiante autenticado. |

Los reportes contienen el código y el contexto mínimo. La API rechaza campos de
texto libre, trazas y otros datos del cliente que no figuran en el contrato.

## Respuestas

- `204` cuando se registra el reporte.
- `400 PARAMETRO_INVALIDO`, `401` o `403 CSRF_INVALIDO` si falla la validación o
  autenticación. Los guards de rol y alcance también pueden responder `403`.
- `404 SESION_NO_ENCONTRADA` si la sesión no existe o es ajena.
- `429 LIMITE_REPORTES` con `Retry-After: 60` al agotar la cuota.

Inicio, respuestas, nodo actual, historial y reportes comparten el filtro global.
Los errores HTTP usan `{ statusCode, codigo, mensaje }`. La validación de una
respuesta puede incluir `campo`. El filtro obtiene el mensaje del catálogo y
mantiene los formatos aprobados fuera de estos endpoints.

Un fallo al preparar un recurso por un problema de carga o firma devuelve
`503 RECURSO_NO_DISPONIBLE`, con un mensaje que permite reintentar. El contenido
ausente o mal configurado conserva el error de RF-26. Ante inconsistencias,
el mensaje orienta a retomar la conversación desde el punto guardado por RF-32.

## Configuración y validación

- El límite elegido para los reportes es de 10 por estudiante en una ventana
  móvil de 60 segundos. PostgreSQL aplica la cuota con un bloqueo por estudiante,
  compartido por las instancias del backend. Los rechazos de entrada del endpoint
  de reportes no se almacenan como reportes adicionales.
- `chat.registro_errores` registra origen, código, fecha, `x_request_id` y estado
  HTTP para fallos de backend. Si se identifica una sesión del propietario, incluye
  la sesión y su nodo persistido. El registro prescinde de respuestas clínicas,
  cuerpos HTTP, credenciales y trazas.
- El diagnóstico se escribe después de revertir la operación de chat, mediante
  una transacción separada. Ante un fallo de diagnóstico, la respuesta original
  conserva su estado y mensaje. El servidor emite un aviso con el identificador.
- La presentación del nodo y del historial se prepara antes del `COMMIT` de una
  reanudación. Un fallo revierte la reparación y conserva la pausa si existía.
- RF-26B conserva el registro inicial `ERROR_CONFIGURACION` cuando no se pudo
  seleccionar un árbol para una sesión nueva.
- El RF deja por definir el umbral de errores consecutivos y la transición
  autorizada para omitir un nodo. Los mensajes de validación orientan a corregir
  la respuesta o solicitar ayuda.

## Trazabilidad

- RF-37, módulo M-3. Relacionado con RF-26, RF-28, RF-29, RF-31 y RF-32.
- La migración `20261120234000_chat_registro_errores_rf37` crea la tabla y sus índices.
- Pruebas HTTP del filtro y del reporte. Integración PostgreSQL del rollback,
  la correlación, la pertenencia de la sesión y la cuota concurrente.
