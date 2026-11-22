# RF-30B (provisional) — Taxonomía de variables y etiquetado de respuestas del chat

## Estado

APROBADA (2026-11-22, plan aprobado por el solicitante). Implementación en `feat/chat-taxonomia-variables-rf30b`.

> El identificador RF-30B es provisional: debe confirmarse contra `Especificacion Requerimientos.xlsx` (SDD §3).

## Historias de usuario

- **Sistema:** etiquetar cada variable que el estudiante reporta en el chat (nivel de craving, frecuencia de vapeo, contexto emocional, situación de riesgo) según la taxonomía del equipo de psicología, y asociarla a su perfil clínico, para que el módulo de seguimiento la interprete y consolide en indicadores.
- **Administrativo (psicología):** indicar en el editor del árbol qué variable captura cada nodo, sin modificar código.

## Modelo

- Una **variable taxonómica** es un tag opcional del nodo: `contenido.variable = { "codigo": "NIVEL_CRAVING" }`. Cada nodo tiene **como máximo una**: debe ser un objeto; arreglos, cadenas o códigos múltiples se rechazan.
- La variable **filtra los tipos de entrada** que admite el nodo (`tipos_entrada_permitidos`).
- Es independiente de `contenido.capturaPerfil` (RF-27B): la captura *clasifica* al estudiante una vez; la variable *mide* algo en cada respuesta. Un nodo puede tener una, la otra, ambas o ninguna.
- Al responder un nodo con variable, el backend guarda una fila **inmutable** en `chat.variables_etiquetadas` dentro de la **misma transacción del POST de RF-30**, con el valor, las etiquetas derivadas, un snapshot del perfil clínico y la versión de la taxonomía.

## Operación y acceso

Todas las rutas exigen sesión completa y rol `ADMINISTRATIVO` (401 sin sesión, 403 sin rol). Las escrituras exigen `X-CSRF-Token`. Respuestas envueltas en `{ "data": ... }`, `Cache-Control: no-store` en la lectura.

| Método y ruta | Body | Éxito | Errores |
| --- | --- | --- | --- |
| `GET /chat/taxonomia-variables?incluir_deshabilitadas=false` | — | 200 | — |
| `POST /chat/taxonomia-variables` | definición (abajo) | 201 | 409 `VARIABLE_DUPLICADA`, 422 `DEFINICION_VARIABLE_INVALIDA` |
| `PATCH /chat/taxonomia-variables/{codigo}` | `{ "habilitada": boolean }` | 200 | 404 `VARIABLE_NO_ENCONTRADA`, 409 `VARIABLE_EN_USO_PUBLICADO` |

### GET

Por defecto solo devuelve las variables habilitadas (lo que el editor ofrece). `incluir_deshabilitadas=true` devuelve todas (gestión de la taxonomía).

```json
{
  "data": {
    "version": "1.0",
    "variables": [
      {
        "codigo": "NIVEL_CRAVING",
        "nombre": "Nivel de craving",
        "descripcion": "Intensidad del deseo de vapear reportada por el estudiante.",
        "tipo_valor": "ENTERO",
        "valores": null,
        "tipos_entrada_permitidos": ["ESCALA", "NUMERICO"],
        "etiquetas": [
          { "min": 0, "max": 3, "etiqueta": "CRAVING_BAJO" },
          { "min": 4, "max": 6, "etiqueta": "CRAVING_MODERADO" },
          { "min": 7, "max": 10, "etiqueta": "CRAVING_ALTO" }
        ],
        "habilitada": true,
        "en_uso_publicado": false
      }
    ]
  }
}
```

### POST (crear)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `codigo` | string | Obligatorio, `^[A-Z][A-Z0-9_]{1,59}$`, único |
| `nombre` | string | Obligatorio, 1–120 caracteres sin contar espacios extremos |
| `descripcion` | string | Opcional, hasta 500 caracteres |
| `tipo_valor` | enum | `ENTERO`, `CATEGORIA` o `BOOLEANO` |
| `valores` | string[] | Solo y obligatorio en `CATEGORIA`: no vacío, sin repetidos |
| `tipos_entrada_permitidos` | enum[] | No vacío, sin repetidos, subconjunto de la tabla siguiente |
| `etiquetas` | array u objeto | Según `tipo_valor` (tabla siguiente) |

| `tipo_valor` | Entradas admitidas | `etiquetas` |
| --- | --- | --- |
| `ENTERO` | `ESCALA`, `NUMERICO` | `[{ "min": int, "max": int \| null, "etiqueta": string }]`, rangos inclusivos que no se solapan; `max: null` = sin tope |
| `CATEGORIA` | `OPCION_UNICA`, `MULTISELECCION` | `{ "<valor>": "<etiqueta>" }`; las claves deben estar en `valores`; una opción sin regla toma su propio valor como etiqueta |
| `BOOLEANO` | `BOOLEANO` | `{ "true": string, "false": string }` (ambas claves) |

Respuesta 201: `{ "data": { "version": "1.1", "variable": { ...misma forma del GET sin en_uso_publicado } } }`.

### PATCH (habilitar / deshabilitar)

- Deshabilitar una variable que usa algún nodo de un flujo **PUBLICADO** → 409 `VARIABLE_EN_USO_PUBLICADO`.
- Pedir el estado que ya tiene no cambia nada ni sube la versión (200 con la versión vigente).
- Respuesta 200: `{ "data": { "version": "1.2", "variable": { ... } } }`.

### Reglas comunes de escritura

- La **definición de una variable no se edita**; solo cambia `habilitada`. Corregir una variable = crear otra y deshabilitar la anterior. No hay borrado.
- Cada escritura que cambia algo, en **una única transacción serializable**: aplica el cambio, crea la versión siguiente de la taxonomía (`1.0 → 1.1 → …`, versión global) en `chat.taxonomia_versiones` y registra auditoría en `chat.auditoria_arboles` con `id_flujo = null`, `id_objeto = id_variable` y acción `CREAR_VARIABLE_TAXONOMIA`, `HABILITAR_VARIABLE_TAXONOMIA` o `DESHABILITAR_VARIABLE_TAXONOMIA` (mismo criterio que 03-G en HU-03).

## Seed (versión 1.0, cargado por migración)

| Código | Tipo | Entradas | Valores / etiquetas |
| --- | --- | --- | --- |
| `NIVEL_CRAVING` | ENTERO | ESCALA, NUMERICO | 0–3 `CRAVING_BAJO` · 4–6 `CRAVING_MODERADO` · 7–10 `CRAVING_ALTO` |
| `FRECUENCIA_VAPEO` | ENTERO | ESCALA, NUMERICO | 0 `SIN_CONSUMO` · 1–5 `FRECUENCIA_BAJA` · 6–15 `FRECUENCIA_MEDIA` · ≥16 `FRECUENCIA_ALTA` |
| `CONTEXTO_EMOCIONAL` | CATEGORIA | OPCION_UNICA, MULTISELECCION | ANSIEDAD, ESTRES, TRISTEZA, ABURRIMIENTO, ENOJO, SOLEDAD, ALEGRIA, CALMA (etiqueta = valor) |
| `SITUACION_RIESGO` | BOOLEANO | BOOLEANO (Sí/No) | `true` → `RIESGO_PRESENTE` · `false` → `RIESGO_AUSENTE` |

Los rangos y categorías son una **propuesta inicial** que el equipo de psicología debe validar; los cambios se hacen creando variables nuevas desde el API.

## Validación del nodo (03-C, 03-D y publicación)

Si el nodo resultante tiene `contenido.variable`, 422 cuando:

| Código | Condición |
| --- | --- |
| `VARIABLE_NODO_INVALIDA` | `variable` no es un objeto con `codigo` de formato válido |
| `VARIABLE_NO_VALIDA` | El código no existe en la taxonomía |
| `VARIABLE_DESHABILITADA` | La variable está deshabilitada |
| `NODO_FINAL_CON_VARIABLE` | El nodo es final (no recibe respuesta) |
| `TIPO_ENTRADA_INCOMPATIBLE` | El tipo de entrada del nodo no está en `tipos_entrada_permitidos` (`detalles.tipos_entrada_permitidos`) |
| `OPCIONES_FUERA_DE_TAXONOMIA` | En `CATEGORIA`, alguna opción del nodo no está en `valores` (`detalles.opciones`) |

Un borrador puede conservar una variable que se deshabilitó después, pero no puede volver a guardarse ni publicarse con ella. En publicación, `detalles.id_nodo` señala el nodo.

## Etiquetado en `POST /chat/sesiones/{id_sesion}/respuestas`

Sin cambios de request ni de response (contrato RF-30).

1. Tras validar la respuesta y resolver la transición, si el nodo tiene variable:
   - Respuesta vacía (nodo opcional) → no se etiqueta.
   - `ENTERO`: el valor debe ser entero (si no, 400 `TIPO_DATO_INVALIDO`, sin escrituras); la etiqueta es la del rango que lo contiene o `null` si ninguno lo cubre.
   - `CATEGORIA`: cada valor debe estar en `valores` (si no, 400 `VALOR_NO_PERMITIDO`). Una multiselección produce un elemento por opción.
   - `BOOLEANO`: el valor debe ser booleano (si no, 400 `TIPO_DATO_INVALIDO`).
2. Después de la captura clínica (RF-27B) y de guardar la interacción, se escribe la fila en `chat.variables_etiquetadas`: interacción, sesión, usuario, nodo, variable, valor crudo, `elementos [{ valor, etiqueta }]`, snapshot (`modalidad` de la sesión, `tipo_dependencia` y `tipo_craving` vigentes en `chat.perfil_clinico`), `estado_etiquetado`, versión vigente de la taxonomía, secuencia y `timestamp_interaccion`.
3. `estado_etiquetado` = `COMPLETO` si ambas dimensiones del perfil existen; `PENDIENTE_PERFIL` en otro caso.
4. Un reenvío idéntico no vuelve a etiquetar (`UNIQUE (id_interaccion)` lo respalda). Cualquier fallo revierte toda la respuesta (500 `ERROR_PERSISTENCIA`).

## Puerto interno para RF-53

`ChatModule` exporta `VariablesEtiquetadasPort` (`application/ports/variables-etiquetadas.port.ts`). `listarPorSesion(idSesion)` devuelve un único payload por sesión o `null` si la sesión no tiene variables etiquetadas:

```json
{
  "id_usuario": "uuid",
  "id_sesion": "uuid",
  "id_interaccion": "uuid",
  "timestamp_interaccion": "2026-11-22T19:40:12.000Z",
  "modalidad_intervencion": "GRUPAL",
  "perfil_clinico": { "tipo_dependencia": "PENDIENTE_PERFIL", "tipo_craving": "PENDIENTE_PERFIL" },
  "variables_sesion": [{ "codigo": "NIVEL_CRAVING", "valor": 4, "etiqueta": "CRAVING_MODERADO" }],
  "estado_etiquetado": "PENDIENTE_PERFIL",
  "version_taxonomia": "1.0"
}
```

- `variables_sesion` en orden de `secuencia`; una multiselección aporta un elemento por opción.
- `id_interaccion`, `timestamp_interaccion`, `perfil_clinico`, `estado_etiquetado` y `version_taxonomia` corresponden a la **última** interacción etiquetada.
- Una dimensión nula se informa como `PENDIENTE_PERFIL`.

## Persistencia

Migración `prisma/migrations/20261122120000_chat_taxonomia_variables_rf30b` (solo SQL; `schema.prisma` se regenera por CI):

- `chat.taxonomia_versiones`: historial inmutable de versiones globales.
- `chat.taxonomia_variables`: sin DELETE; el UPDATE solo admite `habilitada` y `fecha_actualizacion`.
- `chat.variables_etiquetadas`: inmutable (`chat.fn_bloquear_modificacion`).

## Trazabilidad

- HU: etiquetado de variables (Sistema) y marca de variable en el editor (Administrativo).
- RF: RF-30B (provisional), con RF-25, RF-27B, RF-30, RF-39B y RF-53.
- Módulos: M-3 (Chat) → M-5 (Seguimiento).
- Rama: `feat/chat-taxonomia-variables-rf30b`.
- Código: `domain/entities/taxonomia/variable-taxonomia.entity.ts`, `domain/policies/{variable-nodo,validar-variable-nodo.policy,etiquetado-variable.policy}.ts`, `application/services/{variable-nodo,variables-etiquetadas}.service.ts`, `application/use-cases/taxonomia/*`, `application/ports/variables-etiquetadas.port.ts`, `infrastructure/persistence/prisma-{taxonomia-variables,variables-respuesta,variables-etiquetadas}.repository.ts`, `presentation/controllers/taxonomia/taxonomia-variables.controller.ts`, `procesar-respuesta.use-case.ts`.
- Pruebas: unitarias y HTTP colocadas (`*.spec.ts`, `taxonomia-variables.http.spec.ts`, bloque RF-30B de `respuestas-conversacionales.http.spec.ts`); integración `test/chat/taxonomia-variables-rf30b.e2e-spec.ts` (requiere `RF30B_TEST_DATABASE_URL` hacia una base local `brisa_rf30b_*` con las migraciones aplicadas).
- Fuera de alcance: UI del editor y de gestión de la taxonomía (frontend); consumo del puerto en M-5.
