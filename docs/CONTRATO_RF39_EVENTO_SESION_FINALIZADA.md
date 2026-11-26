# RF-39 — Evento de sesión conversacional finalizada

Al completar una sesión con al menos una respuesta válida persistida, PostgreSQL inserta el evento en `chat.eventos_seguimiento` en la misma transacción que cambia el estado a `COMPLETADA`. Se conserva un evento por sesión y origen. Una transacción revertida tampoco deja un evento pendiente. Los cierres anteriores a la migración quedan fuera de esta emisión.

La modalidad y las dimensiones clínicas se toman de la sesión que se está cerrando. Esto conserva la clasificación con la que se realizó la intervención, aunque haya cambiado la asignación vigente del usuario. En modalidad `GRUPAL` las dimensiones van como `null`. Una sesión `PERSONALIZADA` con datos clínicos incompletos impide confirmar el cierre y conserva la atomicidad. RF-39B responde por el perfil vigente al momento de la consulta.

## Consumo interno

La cola BullMQ y el tópico interno se llaman `chat.sesion-finalizada`. El contrato TypeScript `EventoSesionFinalizada` se encuentra en `application/ports/evento-sesion-finalizada.ts` y mantiene el tipo `CHAT_SESION_FINALIZADA`, versión `1.0`. La fecha se serializa en ISO 8601 con UTC. El estado de la entrega queda en el outbox. Esta integración carece de ruta HTTP propia.

El worker de Chat entrega el evento al listener de Seguimiento mediante `EventEmitter2`, como en Cronograma. M05 debe registrar su listener para el mismo tópico, propagar sus errores (`suppressErrors: false` si usa `@OnEvent`) y confirmar solo después de persistir su procesamiento. Si consume el evento y el proceso cae antes de confirmar en PostgreSQL, puede recibir otra entrega con el mismo `id_evento`. M05 debe utilizarlo como clave de idempotencia.

La fila queda `ENCOLADO` tras el cierre, `ENTREGADO` al confirmarse el consumo y `ERROR_REINTENTO` cuando falla un intento de encolado o de entrega. Si Redis pierde el trabajo o BullMQ agota sus intentos, la fila vuelve a ofrecerse a la cola después del intervalo de recuperación. `SINCRONIZACION_OFFLINE` queda reservado para RF-35. El productor actual emite `CIERRE_SESION`.

RF-39 menciona las etiquetas de RF-36 para las variables que las requieran. La comprobación actual se limita a que existan respuestas válidas persistidas. La verificación del etiquetado queda pendiente del contrato y la persistencia de RF-36.

## Configuración

| Variable                        | Uso                                                                                                                                                | Valor inicial |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `CHAT_SEGUIMIENTO_REDIS_URL`    | Conexión privada `redis://` o `rediss://` del backend al broker. Si está ausente, los eventos permanecen en PostgreSQL hasta configurar el worker. | Sin valor     |
| `CHAT_SEGUIMIENTO_INTENTOS`     | Cantidad de intentos de BullMQ antes de recuperar el trabajo desde el outbox.                                                                      | `5`           |
| `CHAT_SEGUIMIENTO_BACKOFF_MS`   | Retraso inicial del backoff exponencial en BullMQ.                                                                                                 | `1000`        |
| `CHAT_SEGUIMIENTO_REENCOLAR_MS` | Intervalo para ofrecer nuevamente eventos pendientes a Redis.                                                                                      | `30000`       |

El worker revisa PostgreSQL cada 200 ms con Redis disponible. El objetivo de emisión del RF es menor a 500 ms en condiciones operativas. La entrega depende de Redis, M05 y la carga del entorno. Para ejecutar las pruebas completas se requieren una base PostgreSQL desechable con prefijo `brisa_rf39_` y una instancia Redis local aislada. Se usan `RF39_TEST_DATABASE_URL` y `RF39_TEST_REDIS_URL` con `pnpm test:e2e:chat --runTestsByPath test/chat/evento-sesion-finalizada-rf39.e2e-spec.ts`.

## Cambio 2026-11-22: outbox multi-tipo (RF-43)

`chat.eventos_seguimiento` tiene ahora la columna `tipo_evento` (`CHAT_SESION_FINALIZADA` por defecto, o `CHAT_SOS_ACTIVADO`) y la columna `id_intervencion_sos`. La cola BullMQ sigue siendo `chat.sesion-finalizada`; el worker entrega cada evento en el tópico de su tipo:

| Tipo | Tópico | Contrato TypeScript |
| --- | --- | --- |
| `CHAT_SESION_FINALIZADA` | `chat.sesion-finalizada` | `EventoSesionFinalizada` |
| `CHAT_SOS_ACTIVADO` | `chat.sos-activado` | `EventoSosActivado` (`application/ports/evento-sos-activado.ts`) |

Las sesiones `SOS` no emiten `CHAT_SESION_FINALIZADA`. El evento SOS se escribe al cerrar la intervención (origen `SOS`) y lleva `id_usuario`, `timestamp_craving`, `tipo_craving` y `duracion_intervencion`, más el estado de la intervención. M05 debe registrar un listener para `chat.sos-activado` con las mismas reglas de idempotencia por `id_evento`. Ver `CONTRATO_RF43_SOS_CRAVING.md`.
