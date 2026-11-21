# RF-31 / RF-32 — Consultar el historial reciente de una sesión

## Estado
Contrato del GET alineado con la definición de la tarea #306 (RF-31).

## Operación y acceso

- `GET /chat/sesiones/{id_sesion}/historial?antes_de_secuencia={n}&limite=20`
- Rol `ESTUDIANTE` con sesión completa (`AccesoEstudiante()`): cookie de sesión.
  Es una operación de solo lectura, así que no exige `X-CSRF-Token`.
- La identidad sale de la cookie (`@IdUsuarioSesion()`), nunca de la ruta ni de la query.
- `Cache-Control: no-store`. Los errores siguen el formato de `ErrorContratoChatFilter`
  (`{ statusCode, codigo, mensaje }`), igual que el RF-26.

## Request

| Campo | Ubicación | Tipo | Regla |
| --- | --- | --- | --- |
| `id_sesion` | ruta | UUID | Obligatorio. |
| `antes_de_secuencia` | query | entero de 1 a 2147483647 | Opcional. Devuelve las interacciones con `secuencia < antes_de_secuencia`. Si se omite, devuelve las más recientes. |
| `limite` | query | entero 1..20 | Opcional, 20 por defecto (RF-32: «las últimas 20 interacciones»). |

Cualquier otro parámetro de query se rechaza con 400 (validación global `forbidNonWhitelisted`).

## Respuesta 200

```json
{
  "data": {
    "items": [
      {
        "id_interaccion": "0b7e…",
        "secuencia": 21,
        "timestamp_interaccion": "2026-11-20T14:02:11.000Z",
        "nodo": {
          "id_nodo": "a1d2…",
          "tipo_nodo": "PREGUNTA",
          "bloques": [
            { "orden": 1, "tipo": "TEXTO", "texto": "¿Cómo te sientes hoy?" },
            { "orden": 2, "tipo": "IMAGEN", "idRecurso": "26…", "url": "https://…", "expiraEn": "…",
              "mimeType": "image/webp", "textoAlternativo": "…", "duracionSegundos": null }
          ]
        },
        "respuesta": { "tipo_entrada": "OPCION_UNICA", "valor": "BIEN", "etiqueta": "Bien" },
        "id_nodo_destino": "0c3b…"
      }
    ],
    "hay_mas": true,
    "siguiente_cursor": 21
  }
}
```

- `items` contiene hasta `limite` interacciones en orden ascendente de `secuencia`.
  La primera consulta devuelve las más recientes. Para reanudar el envío del RF-30,
  el cliente toma la última `secuencia` de esa primera página y le suma 1. Si la página
  está vacía, empieza con 1.
- `hay_mas` indica si quedan interacciones anteriores. En ese caso, `siguiente_cursor`
  es la secuencia del primer elemento. Envíalo como `antes_de_secuencia` para obtener
  la página anterior. En la última página el cursor es `null`.
- `nodo.bloques` reutiliza el formato del RF-26. Las URL de los recursos se firman en
  cada consulta según RF-33 y llevan `idRecurso`.
- `respuesta.tipo_entrada` siempre va en el literal canónico del RF-27, y `respuesta.valor`
  es el valor guardado sin modificar (RF-27: «capturar la respuesta sin modificar su
  estructura»). `CONTINUAR` lleva `valor: null`.
- `respuesta.etiqueta` contiene el texto configurado para una opción única si existe.
  Para los demás tipos de entrada o cuando falta la etiqueta, devuelve `null`.
- Una página vacía responde 200 con `items: []`, `hay_mas: false` y `siguiente_cursor: null`.

## Errores

| HTTP | `codigo` | Caso |
| --- | --- | --- |
| 400 | `PARAMETRO_INVALIDO` | El UUID, el cursor o el límite son inválidos, o la consulta incluye parámetros desconocidos. |
| 401 / 403 | según el guard | Sin sesión, sesión incompleta o rol distinto de estudiante. |
| 404 | `SESION_NO_ENCONTRADA` | La sesión no existe **o pertenece a otro usuario** (RF-26: se trata como inexistente). |
| 422 | `HISTORIAL_INCONSISTENTE` | La integridad de la sesión falla o un paso de la página no tiene respuesta válida o destino comprobable. |
| 500 | `CONTENIDO_NO_DISPONIBLE` | Un nodo del historial no puede presentarse (contenido o recurso no disponible). |

## Configuración y validación

- **Solo lectura.** No inicia, reanuda, pausa ni avanza la sesión, y no escribe en ninguna tabla.
- **Fuente de datos.** Una vez comprobada la pertenencia, el GET valida la sesión y
  lee la página en la misma transacción de PostgreSQL. El destino procede de
  `chat.historial_nodos`. Para un paso sin `id_interaccion`, se exige una coincidencia
  única de sesión, nodo de origen y fecha de captura. Se devuelve la respuesta válida
  de `chat.respuestas` asociada a cada interacción.
- **Privacidad.** No expone `capturaPerfil`, reglas de transición ni de validación, ni el
  perfil clínico (`tipo_dependencia`, `tipo_craving`), igual que el RF-26 (RF-24B, RF-27B).
- **Versión del árbol.** Cada nodo se presenta tal como está en la versión con la que se
  recorrió la sesión (RF-31). Los nodos de un árbol archivado se siguen mostrando.
- **Recuperación (RF-32).** `POST /chat/sesiones/iniciar` devuelve el nodo actual y la
  primera página del historial. El GET permite seguir paginando hacia atrás.
- **Paginación.** El GET usa la clave única existente `(id_sesion, secuencia)` de `chat.interacciones`.

## Registro del estado conversacional (RF-31)

El POST de respuestas guarda la interacción y su paso en `chat.historial_nodos` en la
misma transacción. El paso referencia `id_interaccion`. La sesión avanza solo si su
nodo actual coincide con el origen de la transición. Al llegar a un nodo terminal,
la sesión queda `COMPLETADA` con su fecha. Si el nodo actual ya cambió, el POST
responde `409 NODO_DESACTUALIZADO` y revierte el paso. Un reenvío idempotente devuelve
el resultado original sin registrar otro paso.

La [migración de RF-31](../prisma/migrations/20261120230000_chat_validar_historial_rf31/migration.sql)
crea `chat.fn_validar_historial_sesion`. El POST la consulta antes de confirmar la
transacción. Si encuentra un nodo ajeno a la versión fijada, una transición que no
encadena, un hueco en la secuencia o una incoherencia entre el historial y el nodo
actual, devuelve `422 HISTORIAL_INCONSISTENTE` y revierte la operación. Los pasos
históricos anteriores al vínculo con `id_interaccion` se verifican con los datos
disponibles. La verificación admite sesiones cuyo flujo se haya archivado.

Los eventos que deben pausar una sesión siguen pendientes de definición en el RF.

## Recuperar la sesión conversacional (RF-32, #310)

`POST /chat/sesiones/iniciar` exige cookie de sesión de estudiante, alcance completo
y el encabezado `X-CSRF-Token`. Responde `201` para una sesión nueva y `200` cuando
reutiliza una existente. El identificador del estudiante se obtiene de la sesión autenticada.

La envoltura `data` incluye `reanudada`, `recuperada_desde_historial`, `sesion`,
`nodo_actual`, `historial_reciente` y `ubicacion_temporal`. `nodo_actual` usa la misma
presentación de bloques y entrada de RF-26, con `id_nodo`, `tipo_nodo` y `es_terminal`.
`historial_reciente` usa el formato del GET y contiene las últimas 20 interacciones.
`sesion.ultima_secuencia` es la secuencia del último elemento o `0` si está vacío.

La recuperación conserva el flujo y la versión fijados al iniciar la sesión, incluso
si el flujo se archivó. Si el puntero discrepa del último destino válido registrado,
se restaura dentro de la transacción que verifica la integridad del historial. Una
sesión pausada se reactiva conservando la fecha de su última interacción. Si el
estado sigue siendo inconsistente, la transacción se revierte y devuelve `409`.

| HTTP | Código | Caso |
| --- | --- | --- |
| 401 | según el guard | Falta una sesión de autenticación válida. |
| 403 | `CSRF_INVALIDO` | El token falta o es inválido. Los guards de rol y alcance también pueden devolver `403`. |
| 404 | `SIN_FLUJO_PUBLICADO` | No hay un árbol aplicable al iniciar una conversación. |
| 409 | `PERFIL_INCOMPLETO` | El contexto personalizado requiere un perfil completo. |
| 409 | `ESTADO_INCONSISTENTE` | No se pudo recuperar un nodo y un historial válidos. |
| 409 | `SESION_ERROR_CONFIGURACION` | Ya existe una sesión en `ERROR_CONFIGURACION`. |
| 409 | `FLUJO_NO_PUBLICADO` | RF-26B conserva este error de inicio cuando el árbol personalizado está configurado, pero aún no se puede usar. |
| 422 | `SIN_CRONOGRAMA` | El estudiante no tiene un cronograma asignado. |
| 500 | según el fallo | La lectura, escritura o presentación no pudo completarse. |

Una sesión sin completar impide crear otra. Queda por definir cómo rehabilitar una
sesión en `ERROR_CONFIGURACION` una vez corregido su árbol. La recuperación sin
conexión se realiza en el almacenamiento local del cliente según RF-34.

## Trazabilidad

- **RF de origen:** RF-30 v1.1 (persistencia), RF-31 v1.1 (estado e historial), RF-32 v1.1
  (recuperación con las últimas 20 interacciones y paginación hacia atrás), RF-33 v1.1
  (URL firmadas de vigencia limitada).
- **Módulo:** M-3 (Chat). Depende de M-1 (sesión del usuario) y M-4 (recursos de cronograma).
- **Código:**
  - `domain/repositories/historial-interacciones.repository.ts`
  - `infrastructure/persistence/prisma-historial-interacciones.repository.ts`
  - `application/dto/historial-interacciones.dto-request.ts` y `.dto-response.ts`
  - `application/use-cases/sesion/consultar-historial-interacciones.use-case.ts` (+ `.spec.ts`)
  - `presentation/controllers/sesion/historial-interacciones.controller.ts` (+ `.http.spec.ts`)
- **Specs relacionadas:** [`CONTRATO_RF26_NODO_ACTUAL.md`](CONTRATO_RF26_NODO_ACTUAL.md)
  (forma de `bloques`), [`CONTRATO_RF30_INTERACCIONES.md`](CONTRATO_RF30_INTERACCIONES.md)
  (`secuencia` del envío).
- **Pruebas:** el servicio y los contratos HTTP se cubren con Jest. La suite local
  `test/chat/integration/respuestas-rf27-rf28-rf29.cjs` verifica el registro de pasos,
  la función de integridad, el rollback y la paginación sobre PostgreSQL.
