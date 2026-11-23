# Trazabilidad de una sesión conversacional (auditoría, solo lectura)

## Estado

BORRADOR (`feat/chat-trazabilidad-sesion`).

## Historia

Como usuario administrativo del equipo de psicología, quiero consultar la secuencia completa de nodos, respuestas y transiciones de una sesión conversacional, sin poder modificarla, para auditar el proceso de intervención.

## Operación y acceso

- **Puerto interno para M-8:** `TrazabilidadPort.obtenerSesion(id_sesion)` (`application/ports/trazabilidad-sesion.port.ts`), exportado por `ChatModule`.
- **HTTP:** `GET /chat/admin/sesiones/{id_sesion}/trazabilidad`. Rol `ADMINISTRATIVO` con sesión completa (`@AccesoAdministrativo()`). Es solo lectura, así que no exige CSRF. Responde con `Cache-Control: no-store` y la envoltura `{ data }`.

## Respuesta 200

```json
{
  "data": {
    "id_sesion": "uuid",
    "id_participante": "P-1A2B3C4D",
    "registros": [
      { "secuencia": 1, "id_nodo": "uuid", "respuesta_usuario": { "valor": 7 },
        "id_nodo_destino": "uuid", "timestamp_interaccion": "2026-11-20T14:00:00.000Z" }
    ]
  }
}
```

- `registros` trae todas las interacciones de la sesión en orden ascendente de `secuencia`, sin paginar.
- `respuesta_usuario.valor` es el valor guardado sin modificar (RF-27). `CONTINUAR` lleva `null`.
- `id_nodo_destino` es `null` cuando el registro es el fin del flujo, es decir, una fila de `historial_nodos` sin destino.
- `id_participante` es el seudónimo del participante (A7). Se obtiene con `administrativo.fn_obtener_codigo_participante`, la misma función que usa M-8, que lo crea si el participante aún no tiene uno. Nunca se expone el UUID del estudiante.
- Una sesión sin interacciones responde 200 con `registros: []`.

## Errores

| HTTP | `codigo` | Caso |
| --- | --- | --- |
| 400 | `PARAMETRO_INVALIDO` | `id_sesion` no es un UUID. |
| 401 | `NO_AUTENTICADO` | Sin sesión. |
| 403 | `NO_AUTORIZADO` | Sesión incompleta o rol distinto de `ADMINISTRATIVO`. |
| 404 | `SESION_NO_ENCONTRADA` | La sesión no existe. |
| 422 | `HISTORIAL_INCONSISTENTE` | El historial no supera `chat.fn_validar_historial_sesion`, o a una interacción le falta la respuesta válida o un destino comprobable (igual que RF-31). |

## Configuración y validación

- **Fuente de datos:** `chat.interacciones` + `chat.historial_nodos` + la respuesta válida. Se reutiliza la consulta de RF-31 (`PrismaHistorialInteraccionesRepository`), con su verificación de integridad y la recuperación de destinos de pasos antiguos. La lectura completa (`consultarCompleta`) corre en una transacción `RepeatableRead`.
- **Inmutabilidad:** la garantiza la BD (RF-38). Este feature no escribe en el esquema `chat`. El único efecto secundario posible es crear el seudónimo del participante en `administrativo.seudonimos_participante`.
- El historial del estudiante (RF-31) no cambia: un destino nulo sigue siendo inconsistencia allí.

## Trazabilidad

- RF-31 (historial completo para auditoría), RF-38 (inmutabilidad), RF-27 (respuesta sin modificar), A7 (seudónimo).
- Módulos: M-3 (Chat) → M-8 (Administrativo).
- Sin migración.
- Pruebas:
  - unitarias: `consultar-trazabilidad-sesion.use-case.spec.ts`, `trazabilidad-sesion.http.spec.ts` y `consultarCompleta` en `prisma-historial-interacciones.repository.spec.ts`;
  - e2e: `test/chat/trazabilidad-sesion.e2e-spec.ts` con `TRAZABILIDAD_TEST_DATABASE_URL` (base local `brisa_traz_*`).
