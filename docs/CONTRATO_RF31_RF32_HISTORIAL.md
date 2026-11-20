# RF-31 / RF-32 — Consultar el historial reciente de una sesión

## Estado
APROBADA (2026-11-20). Rama `feat/chat-rf32-historial-interacciones`.

## Operación y acceso

- `GET /chat/sesiones/:idSesion/interacciones?antes_de=<secuencia>&limite=<1..20>`
- Rol `ESTUDIANTE` con sesión completa (`AccesoEstudiante()`): cookie de sesión.
  Es una operación de solo lectura, así que no exige `X-CSRF-Token`.
- La identidad sale de la cookie (`@IdUsuarioSesion()`), nunca de la ruta ni de la query.
- `Cache-Control: no-store`. Los errores siguen el formato de `ErrorContratoChatFilter`
  (`{ statusCode, codigo, mensaje }`), igual que el RF-26.

## Request

| Campo | Ubicación | Tipo | Regla |
| --- | --- | --- | --- |
| `idSesion` | ruta | uuid | Obligatorio. Si no es un UUID, responde 400. |
| `antes_de` | query | entero ≥ 1 | Opcional. Devuelve solo las interacciones con `secuencia < antes_de`. Si se omite, devuelve las más recientes. |
| `limite` | query | entero 1..20 | Opcional, 20 por defecto (RF-32: «las últimas 20 interacciones»). |

Cualquier otro parámetro de query se rechaza con 400 (validación global `forbidNonWhitelisted`).

## Respuesta 200

```json
{
  "data": {
    "id_sesion": "6c1f…",
    "ultima_secuencia": 7,
    "hay_mas": true,
    "interacciones": [
      {
        "id_interaccion": "0b7e…",
        "secuencia": 6,
        "timestamp_interaccion": "2026-11-20T14:02:11.000Z",
        "registrada_en": "2026-11-20T14:02:11.420Z",
        "nodo": {
          "idNodo": "a1d2…",
          "bloques": [
            { "orden": 1, "tipo": "TEXTO", "texto": "¿Cómo te sientes hoy?" },
            { "orden": 2, "tipo": "IMAGEN", "idRecurso": "26…", "url": "https://…", "expiraEn": "…",
              "mimeType": "image/webp", "textoAlternativo": "…", "duracionSegundos": null }
          ],
          "entrada": { "tipo": "OPCION_UNICA", "obligatorio": true, "min": null, "max": null, "paso": null,
                       "opciones": [{ "valor": "BIEN", "etiqueta": "Bien" }], "etiquetas": null, "maxCaracteres": null }
        },
        "respuesta": { "tipo_entrada": "OPCION_UNICA", "valor": "BIEN" }
      }
    ]
  }
}
```

- `interacciones` va en **orden ascendente** de `secuencia`. La página trae como máximo
  `limite` elementos, los más recientes que cumplen `antes_de`.
- `ultima_secuencia` es la secuencia más alta registrada en la sesión (0 si no hay ninguna),
  sin importar `antes_de`. El cliente la usa para enviar `secuencia = ultima_secuencia + 1`
  en el `POST /respuestas` del RF-30 al reanudar una sesión.
- `hay_mas` es `true` si existen interacciones más antiguas que la primera de la página.
  Para la siguiente página se envía `antes_de` = la `secuencia` de esa primera interacción.
- `nodo.bloques` y `nodo.entrada` usan **la misma forma (camelCase) que el RF-26**, a
  propósito, para que el cliente reutilice su mapeo. Las URL de los recursos se firman de
  nuevo en cada consulta (RF-33: el cliente no guarda URL), y llevan `idRecurso`.
- `respuesta.tipo_entrada` siempre va en el literal canónico del RF-27, y `respuesta.valor`
  es el valor guardado sin modificar (RF-27: «capturar la respuesta sin modificar su
  estructura»). `CONTINUAR` lleva `valor: null`.
- Una sesión sin interacciones responde 200 con `interacciones: []`, `ultima_secuencia: 0`
  y `hay_mas: false`.

## Errores

| HTTP | `codigo` | Caso |
| --- | --- | --- |
| 400 | `null` | `idSesion` no es UUID, o `antes_de`/`limite` no son válidos o hay parámetros desconocidos. |
| 401 / 403 | según el guard | Sin sesión, sesión incompleta o rol distinto de estudiante. |
| 404 | `SESION_NO_ENCONTRADA` | La sesión no existe **o pertenece a otro usuario** (RF-26: se trata como inexistente). |
| 500 | `CONTENIDO_NO_DISPONIBLE` | Un nodo del historial no puede presentarse (contenido o recurso no disponible). |

## Configuración y validación

- **Solo lectura.** No inicia, reanuda, pausa ni avanza la sesión, y no escribe en ninguna tabla.
- **Fuente de datos.** `chat.interacciones` con su `chat.respuestas` (la válida y única
  por interacción), filtradas por la sesión del usuario autenticado. Solo se persisten
  respuestas válidas (RF-28), así que el historial no muestra respuestas rechazadas.
- **Privacidad.** No expone `capturaPerfil`, reglas de transición ni de validación, ni el
  perfil clínico (`tipo_dependencia`, `tipo_craving`), igual que el RF-26 (RF-24B, RF-27B).
- **Versión del árbol.** Cada nodo se presenta tal como está en la versión con la que se
  recorrió la sesión (RF-31). Los nodos de un árbol archivado se siguen mostrando.
- **Recuperación (RF-32).** La reanudación sigue en `POST /chat/sesiones/iniciar`, que
  devuelve la sesión y el nodo actual. Este endpoint completa el contexto con el historial
  reciente y la última secuencia; no hay un servicio de recuperación aparte.
- **Sin migración.** Usa la clave única existente `(id_sesion, secuencia)` de `chat.interacciones`.

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
  (forma de `bloques` y `entrada`), [`CONTRATO_RF30_INTERACCIONES.md`](CONTRATO_RF30_INTERACCIONES.md)
  (`secuencia` del envío).
- **Prueba e2e:** pendiente de habilitar con la base de datos local (sección 10 del SDD).
- **Frontend:** consumido por la ficha `docs/specs/M03/RF-32.md` de `Brisa-Frontend`.
