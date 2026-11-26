# RF-24 / RF-26 / RF-29 — Ritmo de la terapia según el cronograma

## Estado

IMPLEMENTADA en `feat/chat-usabilidad-flujo-rf25` (pendiente de PR). Depende de RF-22 (ubicación temporal del usuario), RF-11 (programación de disponibilidad) y RF-17 (cronograma por usuario).

## Operación y acceso

Sin rutas nuevas. Cambian:

- `GET /chat/sesiones/:id_sesion/nodo-actual` y `POST /chat/sesiones/iniciar` (`nodo_actual`): campo nuevo `disponibilidad`.
- `POST /chat/sesiones/:id_sesion/respuestas`: 409 nuevo.

Acceso igual que hoy (cookie de estudiante, `X-CSRF-Token` en el POST).

## Request

Sin cambios.

## Respuestas

| Caso | Respuesta |
| --- | --- |
| Nodo habilitado | `nodo.disponibilidad = { habilitado: true, habilitaAprox: null }` (en `iniciar`: `habilita_aprox`). Contenido y entrada como siempre. |
| Nodo en espera | `nodo.disponibilidad = { habilitado: false, habilitaAprox: "<ISO>" \| null }`, `bloques: []`, `entrada: null`. No se consultan recursos ni se firman URL. |
| Responder un nodo en espera | **409 `NODO_EN_ESPERA_CRONOGRAMA`**, `detalles.habilita_aprox`. No se registra nada. |
| El cronograma no responde | Error del cronograma (500 genérico). Nunca se habilita por defecto. |

## Configuración y validación

1. **Habilitación (R1).** Un nodo sin `id_contenido_cronograma` está habilitado. Con contenido, está habilitado si `fecha_inicio_disponibilidad` del contenido es menor o igual al instante efectivo del usuario en la plantilla. Ese instante es inicio de la plantilla + tiempo efectivo transcurrido (RF-22, descuenta pausas), el mismo cálculo de `fn_contenido_vigente_usuario`. Con el cronograma finalizado, todo está habilitado.
2. **Usuarios atrasados (R2).** Solo se bloquea por inicio, nunca por fin. Un contenido ya iniciado sigue habilitado aunque haya finalizado, así que el usuario puede ponerse al día sin adelantarse a su unidad actual.
3. **Espera (R3).** La sesión avanza hasta el nodo en espera y sigue `ACTIVA`. Al llegar la fecha, el nodo se puede responder sin otra acción.
4. **Fecha (R4).** `habilitaAprox` = ahora + (inicio del contenido − instante efectivo). Es aproximada: una pausa futura la corre.
5. **Sin regla aplicable.** Un contenido que no está programado en el cronograma del usuario (o no tiene fecha de inicio) no bloquea, para que nadie quede trabado de forma permanente.
6. **Límites del módulo.** El chat consulta al cronograma solo por el puerto `ConsultaHabilitacionContenidoPort` (servidor a servidor).

## Trazabilidad

- RF: RF-24, RF-26, RF-29, con RF-22, RF-11 y RF-17 (M-4).
- Módulos: M-3 (Chat), M-4 (Cronograma).
- Migración: `prisma/migrations/20261122010000_chat_cronograma_habilitacion_contenido` (`cronograma.fn_habilitacion_contenido_usuario`).
- Código:
  - Cronograma: `cronograma/application/ports/consulta-habilitacion-contenido.port.ts`, `cronograma/application/service/consulta-habilitacion-contenido.service.ts`, `PrismaContenidoVigenteUsuarioRepository.consultarHabilitacion`.
  - Chat: `chat/application/services/habilitacion-nodo.service.ts`, `chat/domain/policies/habilitacion-nodo.policy.ts`, `chat/infrastructure/persistence/cronograma-habilitacion-contenido-chat.repository.ts`, `presentar-nodo-actual.service.ts`, `procesar-respuesta.use-case.ts`.
- Tests: `habilitacion-nodo.service.spec.ts`, `respuestas-conversacionales.http.spec.ts` (409), `nodo-actual.http.spec.ts`, `iniciar-o-reanudar-sesion.use-case.spec.ts`.
- Fuera de alcance: la precarga sin conexión (RF-34) aún descarga el árbol completo. Debería limitarse a los nodos habilitados.

## Cambios

### 2026-11-22 · Un flujo para varios cronogramas: el nodo se liga al contenido

**Motivo.** Una programación (`id_contenido_cronograma`) pertenece a un solo cronograma. Con varios cronogramas activos, los estudiantes de los demás cronogramas nunca quedaban bloqueados. Los cronogramas reutilizan los mismos contenidos con unidades y fechas propias.

1. **Chat.** El nodo se liga al **contenido**: `nodos.id_contenido` (FK a `cronograma.contenidos`). `id_contenido_cronograma` queda **obsoleto**: se rellenó desde él, ya no se escribe y se eliminará en una migración posterior. La API de nodos usa `id_contenido` en request y response.
2. **Habilitación.** `fn_habilitacion_contenido_usuario(p_id_usuario, p_id_contenido, p_fecha)` busca la programación del contenido **en el cronograma asignado al usuario**. Las reglas R1–R5 no cambian. Si el contenido no está programado en su cronograma, no bloquea.
3. **Recursos del nodo.** Se consultan por `id_contenido`. Esto corrige un bug: antes se pasaba el id de la programación y ningún recurso se encontraba.
4. **M04 (cronograma).** Un contenido se programa **a lo sumo una vez por cronograma**. Antes era una vez en todo el sistema, aunque el mensaje de `ContenidoUnicaUnidadTemporalException` ya decía "dentro del mismo cronograma".
   - Nueva columna `contenidos_cronograma.id_cronograma`, asignada por trigger desde la unidad.
   - El único global `uq_contenido_unico_en_cronograma` se reemplaza por `uq_contenido_unico_por_cronograma (id_cronograma, id_contenido)`.
   - `AsociarContenidoUnidadTemporalUseCase` valida con `obtenerPorIdContenidoEnCronograma`.
   - El catálogo de contenidos de M04 muestra la primera programación. Mostrarlas todas queda para el equipo de M04 (aclaración A-070 del frontend).
5. **Catálogo admin** (`GET /chat/admin/catalogos`). Nueva lista `contenidos` = `[{ id_contenido, nombre_contenido, tipo_contenido, programaciones: [{ id_contenido_cronograma, cronograma: { id_cronograma, nombre_cronograma, estado }, unidad: { id_unidad_temporal, orden_unidad, nombre_unidad, fecha_inicio, fecha_fin }, fecha_inicio_disponibilidad, fecha_fin_disponibilidad }] }]`. Las fechas de la unidad son de plantilla, en formato `AAAA-MM-DD`. `contenidos_cronograma` se mantiene mientras haya clientes que lo usen.

Migración: `prisma/migrations/20261122030000_cronograma_contenido_por_cronograma_y_nodo_contenido`.
