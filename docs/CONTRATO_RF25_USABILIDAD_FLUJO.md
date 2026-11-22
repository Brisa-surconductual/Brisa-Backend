# RF-25 / RF-27B / RF-29 — Usabilidad del editor de flujos y fin de la terapia

## Estado

BORRADOR → en implementación en `feat/chat-usabilidad-flujo-rf25`. Complementa
`CONTRATO_HU03_CHAT_ADMIN.md` (endpoints de nodos, transiciones y publicación),
`CONTRATO_RF27_RF28_RF29.md` (motor) y `CONTRATO_RF26_NODO_ACTUAL.md` (`esTerminal`).

## Operación y acceso

Sin rutas nuevas. Cambian los cuerpos y respuestas de:

- `POST /chat/admin/flujos/:id_flujo/nodos` y `PATCH /chat/admin/nodos/:id_nodo`
- `POST /chat/admin/flujos/:id_flujo/transiciones` y `PATCH /chat/admin/transiciones/:id_regla`
- `POST /chat/admin/flujos/:id_flujo/publicar` y `/validar`
- `GET /chat/admin/flujos/:id_flujo` (cada nodo expone `es_nodo_final`)
- `POST /chat/sesiones/:id_sesion/respuestas` y la consulta del nodo actual (comportamiento)

Acceso igual que hoy (`@AccesoAdministrativo()` en admin, cookie de estudiante en sesión).

## Request

### Nodo (crear / actualizar)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `es_nodo_final` | boolean, opcional (crear: `false`) | Un único nodo final por flujo. No puede ser también inicial. No declara `contenido.entrada`. No puede tener transiciones de salida. No puede capturar perfil clínico. |
| `contenido.capturaPerfil` | `{ dimension, valor? }` | `dimension` ∈ `TIPO_DEPENDENCIA`, `TIPO_CRAVING`. `valor` ∈ `ABSTINENCIA_FISICA`/`TOLERANCIA` (dependencia) o `POSITIVO`/`NEGATIVO` (craving). Con `valor`, el nodo **asigna** ese valor al perfil del estudiante al responderlo. Sin `valor` (legado), el valor sale de la respuesta (selección única). |
| `contenido.entrada.paso` | — | En `ESCALA` se descarta al guardar: la escala avanza de 1 en 1. `NUMERICO` sin cambios. |
| `eliminar_transiciones_afectadas` | boolean, opcional (solo `PATCH`) | Confirma que se eliminen las transiciones de salida que dejan de tener sentido al cambiar el tipo de respuesta. |

### Transición (crear)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `orden_evaluacion` | int ≥ 1, **opcional** | Por defecto: máximo de las transiciones específicas del origen + 1. |
| `id_nodo_destino_otro` | uuid, opcional | "Cualquier otra respuesta": crea (o redirige) la transición por defecto del origen, operador `SIEMPRE`. Debe ser distinto del origen. No aplica a orígenes sin respuesta (CONTINUAR). |
| `regla_validacion.operador_condicion` | `IGUALDAD` \| `RANGO` \| `SIEMPRE` | `SIEMPRE` crea solo la transición por defecto (sin `valor_esperado`). |

## Respuestas

| Código | Caso |
| --- | --- |
| 422 `NODO_INICIAL_Y_FINAL` | Un nodo no puede ser inicial y final a la vez. |
| 422 `NODO_FINAL_CON_ENTRADA` | El nodo final no espera respuesta. |
| 422 `NODO_FINAL_CON_SALIDAS` | El nodo final no puede tener transiciones de salida (o se intenta crear una desde él). |
| 422 `NODO_FINAL_CON_CAPTURA` | El nodo final no puede capturar perfil clínico. |
| 409 `NODO_FINAL_DUPLICADO` | El flujo ya tiene un nodo final. |
| 422 `CAPTURA_PERFIL_INVALIDA` | Dimensión o valor de captura no válidos. |
| 409 `TRANSICIONES_AFECTADAS` | El cambio de tipo de respuesta invalida transiciones; `detalles.transiciones = [{ id_regla, id_nodo_destino, orden_evaluacion }]`. Reenviar con `eliminar_transiciones_afectadas: true`. |
| 422 `TRANSICION_AUTORREFERENCIADA` | Origen y destino son el mismo nodo. |
| 422 `TRANSICION_HACIA_NODO_INICIAL` | El nodo inicial no puede ser destino. |
| 409 `TRANSICION_POR_DEFECTO_DUPLICADA` | El origen ya tiene una transición `SIEMPRE` (usar `id_nodo_destino_otro` para redirigirla). |
| 422 `DESTINO_IGUAL_A_POR_DEFECTO` | Una transición específica y "cualquier otra respuesta" del mismo origen irían al mismo nodo (al crear, al editar o al redirigir la transición por defecto). |
| 422 `GRAFO_INVALIDO` | Además de lo existente, `detalles.sin_nodo_final` y `detalles.nodos_sin_salida`. |
| 422 `NODO_CAPTURA_PERFIL_INVALIDO` | Además de lo existente, `detalles.dimensiones_valores_faltantes = [{ dimension, valores_faltantes }]`. |

El nodo devuelto incluye `es_nodo_final`. La transición `SIEMPRE` se devuelve con
`regla_validacion.operador_condicion = "SIEMPRE"` y `valor_esperado = {}`.

## Configuración y validación

1. **Nodo final.** Columna `chat.nodos.es_nodo_final` con índice parcial único por flujo
   y `CHECK` que impide inicial y final a la vez. Publicar exige exactamente un nodo final.
2. **Fin de la terapia.** La sesión pasa a `COMPLETADA` al llegar al nodo final.
   `esTerminal`/`es_terminal` = destino `es_nodo_final`. Los flujos sin nodo final
   marcado (legado) conservan la regla anterior: terminal = sin transiciones de salida.
3. **Avance implícito.** En flujos con nodo final, un nodo sin respuesta (CONTINUAR) y
   sin transiciones explícitas avanza al siguiente nodo por `orden`. Esta arista cuenta
   para huérfanos, ciclos y `nodos_sin_salida`. Una transición explícita tiene prioridad.
4. **Transición por defecto (`SIEMPRE`).** Máximo una por origen. Siempre queda última
   en el orden de evaluación (se renumera sola tras cada alta o edición de transiciones
   del origen). Siempre coincide. Cubre todos los valores en el diagnóstico de cobertura.
   Su destino debe ser distinto del de todas las transiciones específicas del mismo origen.
5. **Orden por defecto.** Máximo de las transiciones específicas del origen + 1.
6. **Cambio de tipo de respuesta.** Si cambia `entrada.tipo` (o se quita o añade
   `entrada`) y el nodo tiene transiciones de salida, se exige confirmación y luego se
   eliminan junto con sus reglas, en la misma transacción y con auditoría.
7. **Captura con valor (grupal).** Por cada dimensión deben existir nodos de captura
   que cubran todos sus valores. Varias ramas pueden asignar el mismo valor. No se
   mezcla captura con valor y captura legado en una misma dimensión.

## Trazabilidad

- RF: RF-25 (gestión del árbol), RF-27B (perfil clínico), RF-29 (transición), RF-26 (`esTerminal`), RF-30/31 (regla `SIEMPRE`, orden único por origen).
- Módulo: M-3 (Chat).
- Migración: `prisma/migrations/20261121180000_chat_nodo_final_usabilidad`.
- Decisión técnica: `es_nodo_final` se lee y escribe con SQL parametrizado (`$queryRaw`/`$executeRaw`) hasta que el workflow `prisma-generate-schema` regenere `schema.prisma` tras el merge. Así el CI del PR compila contra el cliente actual.
- Tests: `nodo-final.policy.spec.ts`, `arbol-conversacional.entity.spec.ts`, `regla-por-tipo-entrada.spec.ts`, `motor-respuesta-conversacional.policy.spec.ts`, `crear-transicion-conversacional.use-case.spec.ts`, `actualizar-nodo-conversacional.use-case.spec.ts`, `publicar-flujo.use-case.spec.ts`.
