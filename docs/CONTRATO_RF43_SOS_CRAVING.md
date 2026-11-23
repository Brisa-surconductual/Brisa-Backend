# RF-43 — Protocolo SOS "Tengo ganas de vapear"

## Estado

BORRADOR (`feat/chat-sos-craving-rf43`).

## Operación y acceso

Estudiante (`@AccesoEstudiante()`). CSRF en las escrituras. Envoltura `{ data }`. `Cache-Control: no-store`.

- `POST /chat/sos/activar`: body opcional `{ contexto_origen?: { modulo, ruta, estado? } }`. `modulo` ∈ `CHAT`, `DIARIO`, `CRONOGRAMA`, `CONTENIDO`, `PERFIL`, `OTRO`. Si `estado` supera 16 KB se descarta sin bloquear el SOS.
- Las respuestas van por `POST /chat/sesiones/{id_sesion_sos}/respuestas` (RF-30).
- `POST /chat/sos/{id_intervencion}/finalizar`: body `{ motivo: COMPLETADA | CERRADA_POR_USUARIO | TIEMPO_AGOTADO }`.
- Para retomar, `POST /chat/sesiones/iniciar` (RF-32) reanuda la sesión pausada en el mismo nodo.
- Admin: `POST /chat/admin/flujos-sos` `{ nombre }` crea el borrador SOS (siguiente versión). Nodos, transiciones, publicar, clonar y archivar usan las rutas de HU-03 / HU-05. `POST /chat/admin/flujos` rechaza `modalidad=SOS` (400 `MODALIDAD_SOS_RUTA_PROPIA`).

## Respuestas

```json
{
  "activar": {
    "data": {
      "id_intervencion": "uuid",
      "id_sesion_sos": "uuid",
      "sesion_pausada": { "id_sesion": "uuid" },
      "inicio_servidor": "2026-11-20T04:40:00-05:00",
      "fin_maximo_servidor": "2026-11-20T04:41:00-05:00",
      "nodo_actual": { "id_nodo": "uuid", "bloques": [], "entrada": {} },
      "recursos_apoyo": [{ "nombre": "Línea 106", "telefono": "106" }],
      "contexto_origen": null
    }
  },
  "finalizar": {
    "data": {
      "duracion_segundos": 15,
      "estado": "INCOMPLETA",
      "sesion_pausada": { "id_sesion": "uuid", "id_nodo_actual": "uuid" },
      "contexto_retorno": null
    }
  }
}
```

- activar: 201 · 401 · 403 `CSRF_INVALIDO` · 404 `SIN_FLUJO_SOS` · 409 `INTERVENCION_EN_CURSO` (`detalles.id_intervencion`, `detalles.fin_maximo_servidor`).
- finalizar: 200 · 404 `INTERVENCION_NO_ENCONTRADA` · 409 `INTERVENCION_FINALIZADA` · 400 si el motivo es inválido.
- respuestas en una sesión SOS: 409 `TIEMPO_AGOTADO` después de `fin_maximo_servidor`; 409 `INTERVENCION_FINALIZADA` si ya se cerró.

## Reglas

- El flujo SOS es un flujo propio (`modalidad = SOS`), con un único publicado, como el grupal. No captura perfil clínico ni liga nodos al cronograma (422 `FLUJO_SOS_INVALIDO` al publicar).
- Activar pausa la sesión de terapia ACTIVA (`motivo_pausa = SOS_CRAVING`, `fecha_pausa`) y crea una sesión SOS. Las sesiones SOS no cuentan como pendientes para RF-24 / RF-32.
- El inicio, el límite (+60 s) y la duración salen del reloj de PostgreSQL (`chat.intervenciones_sos`).
- Mapeo de motivo a estado: `COMPLETADA` → `COMPLETA` (solo si la sesión SOS llegó al nodo final; si no, `INCOMPLETA`); `CERRADA_POR_USUARIO` → `INCOMPLETA`; `TIEMPO_AGOTADO` → `EXPIRADA`. Pasado el límite, el estado siempre es `EXPIRADA` y la duración queda topada en 60 s.
- El cierre (`chat.fn_cerrar_intervencion_sos`) escribe `CHAT_SOS_ACTIVADO` en el outbox de RF-39 en la misma transacción. Un cron cierra como `EXPIRADA` las intervenciones abandonadas (30 s de gracia) y borra `contexto_origen` 24 h después del cierre (Ley 1581).
- `tipo_craving` sale del perfil vigente (RF-39B); va `null` si no está clasificado.

## Evento a M05

Tópico `chat.sos-activado` (misma cola BullMQ de RF-39). Payload `EventoSosActivado` (`application/ports/evento-sos-activado.ts`): `id_evento`, `tipo: CHAT_SOS_ACTIVADO`, `version: 1.0`, `id_usuario`, `id_intervencion`, `timestamp_craving` (UTC), `tipo_craving`, `duracion_intervencion`, `estado_intervencion`, `nivel_craving: 5`, `estado_sesion_anterior`.

## Fuera de alcance

Front, FA-2 offline (RF-35), FA-3 crisis severa, bloqueo de push (M07), panel de recursos (solo seed), micro-evaluación y consumidor M05.

## Trazabilidad

- RF-43 (con RF-25, RF-31, RF-32, RF-39). Módulos M-3 → M-5.
- Migraciones: `20261122150000_chat_sos_enums_rf43`, `20261122150100_chat_intervenciones_sos_rf43`. El seed del flujo v1 (contenido provisional) solo corre si existen un usuario ADMINISTRATIVO y el tipo de nodo `MENSAJE`.
- Las tablas nuevas se usan con SQL parametrizado hasta que `prisma-generate-schema` regenere `schema.prisma` tras el merge. Hasta regenerar el cliente, Prisma no puede leer filas con `modalidad = SOS`.
- Pruebas: unitarias (`activar-sos`, `finalizar-intervencion-sos`, `crear-flujo-sos`, rama SOS de `publicar-flujo`, `pausar()`, ruteo del worker, 409 SOS en `respuestas`) y e2e `test/chat/sos-craving-rf43.e2e-spec.ts` con `RF43_TEST_DATABASE_URL` (base local `brisa_rf43_*`, migrada y con el cliente Prisma regenerado desde ella).
