# RF-30 · Persistir interacciones del chat

Este contrato reemplaza la escritura de la etapa 2. Las reglas de validación y
transición de RF-27, RF-28 y RF-29 se mantienen, incluida la captura clínica
grupal de RF-27B.

`POST /chat/sesiones/{id_sesion}/respuestas` exige la sesión completa de un
estudiante y el encabezado `X-CSRF-Token`.

```json
{
  "id_interaccion": "8f1c2a7e-3b4d-4e5f-9a10-1b2c3d4e5f60",
  "id_nodo": "uuid",
  "secuencia": 7,
  "tipo_entrada": "ESCALA",
  "valor": 7,
  "timestamp_interaccion": "2026-11-13T19:40:12-05:00",
  "estado_conectividad": "EN_LINEA",
  "recursos_no_presentados": null
}
```

Todos los campos son obligatorios salvo `recursos_no_presentados`, que admite
una lista no vacía de UUID o `null`. Omitirlo equivale a `null`. Los estados
admitidos son `EN_LINEA` y `SIN_CONEXION`. Los tipos de entrada son
`OPCION_UNICA`, `MULTISELECCION`, `ESCALA`, `NUMERICO`, `FECHA_HORA`,
`BOOLEANO`, `TEXTO_LIBRE` y `CONTINUAR`. En `CONTINUAR`, enviar
`"valor": null`; omitir la propiedad es una interacción incompleta.

La sesión se bloquea con `FOR UPDATE`. Bajo ese bloqueo se consulta primero
el UUID y, para una interacción nueva, se exige la última secuencia + 1
(la primera es 1). La secuencia, no el reloj del dispositivo, establece el
orden de la sesión. El timestamp capturado y la fecha de registro del
servidor se conservan como datos distintos.

Se escriben la interacción, la respuesta y su historial antes de mover el
nodo actual. La validación, la captura clínica aplicable y el avance son
parte de la misma transacción. El UUID público identifica la fila de
`chat.interacciones`; la respuesta mantiene su propio ID interno.

El primer envío responde `201` con `{ data: { id_interaccion, secuencia,
registrada_en, duplicada, transicion, estado_sesion } }`. La transición
contiene `id_nodo_origen`, `id_nodo_destino` y `es_terminal`.
`registrada_en` se devuelve en ISO 8601 UTC. Un reenvío idéntico responde
`200` con el resultado original, salvo `duplicada: true`, incluso si la
sesión avanzó o terminó. El reenvío debe conservar el timestamp original
y el orden de los arreglos. Los UUID se comparan sin distinguir mayúsculas.
Se guarda una huella del contenido junto al resultado confirmado en
`chat.respuestas.resultado_procesamiento`. Un UUID ya ocupado por una
interacción histórica sin esa huella no se puede reconocer como reenvío
idéntico: se rechaza con `409` sin modificar la fila.

| HTTP      | Código o resultado                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 201 / 200 | Registrada / reenvío idéntico                                                                                                                   |
| 400       | `TIPO_ENTRADA_NO_PERMITIDO`, `RESPUESTA_OBLIGATORIA`, `TIPO_DATO_INVALIDO`, `FUERA_DE_RANGO`, `FORMATO_INCORRECTO`, `VALOR_NO_PERMITIDO`        |
| 401       | `NO_AUTENTICADO`                                                                                                                                |
| 403       | `CSRF_INVALIDO` cuando el token falta o es inválido                                                                                             |
| 404       | `SESION_NO_ENCONTRADA`                                                                                                                          |
| 409       | `ID_INTERACCION_REUTILIZADA`, `SECUENCIA_FUERA_DE_ORDEN`, `NODO_DESACTUALIZADO`, `NODO_TERMINAL`, `SESION_NO_ACTIVA`, `CAPTURA_FUERA_DE_GRUPAL` |
| 422       | `INTERACCION_INCOMPLETA`, `HISTORIAL_INCONSISTENTE` (RF-31)                                                                                       |
| 500       | `ERROR_PERSISTENCIA`, `SIN_TRANSICION`, `DESTINO_INVALIDO`                                                                                      |

La [migración de etapa 3](../prisma/migrations/20261115110915_fix_etapa3_chat/migration.sql)
ya define secuencia única por sesión e inmutabilidad de las interacciones.
El contrato acepta capturas hechas fuera de línea cuando llegan al servidor;
el almacenamiento local y la sincronización de lotes se tratan en RF-34/RF-35.
