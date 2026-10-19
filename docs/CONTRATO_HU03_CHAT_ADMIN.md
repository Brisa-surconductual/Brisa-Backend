# Contrato backend HU-03 — Administración de árboles conversacionales

Contrato contrastado con HU-03/RF-25 y HU-05/RF-25B compartidas el 2026-10-17.
Las rutas del backend comienzan por `/chat/admin`, sin prefijo `/api`.

Todas las operaciones requieren sesión completa y rol `ADMINISTRATIVO`.
Sin sesión: 401; con sesión sin autorización: 403. Las escrituras requieren el
token CSRF de la sesión. El actor siempre se obtiene de la sesión autenticada.

Las respuestas satisfactorias usan `{ "data": ... }`. Las rutas anteriores de
`/chat/administracion` conservan su formato previo para mantener compatibilidad.

## Operaciones

| Ref. | Método y ruta                                     | Body                                                                                                                    | Respuesta                                                                                    |
| ---- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 03-A | `POST /chat/admin/flujos`                         | `nombre`, `modalidad`; `tipo_dependencia` y `tipo_craving` obligatorios para PERSONALIZADA                              | 201, `data`: flujo en BORRADOR, UUID, versión, actor y fecha                                 |
| 03-B | `GET /chat/admin/flujos/{id_flujo}`               | —                                                                                                                       | 200, `data`: `flujo`, `nodos[]`, `transiciones[]`; incluye fechas de publicación y archivado |
| 03-C | `POST /chat/admin/flujos/{id_flujo}/nodos`        | `id_tipo_nodo`, `contenido`; opcionales `es_nodo_inicial` (false), `orden`, `id_contenido_cronograma`                   | 201, `data`: nodo creado                                                                     |
| 03-D | `PATCH /chat/admin/nodos/{id_nodo}`               | Al menos un campo editable del nodo                                                                                     | 200, `data`: nodo actualizado y `fecha_actualizacion`                                        |
| 03-E | `POST /chat/admin/flujos/{id_flujo}/transiciones` | `id_nodo_origen`, `id_nodo_destino`, `id_regla_validacion`, `operador_condicion`, `valor_condicion`, `orden_evaluacion` | 201, `data`: transición                                                                      |
| 03-F | `PATCH /chat/admin/transiciones/{id_regla}`       | Al menos uno: `id_nodo_destino`, `id_regla_validacion`, `operador_condicion`, `valor_condicion`, `orden_evaluacion`     | 200, `data`: transición actualizada                                                          |
| 03-G | `PATCH /chat/admin/reglas-validacion`             | Definición de regla reutilizable, detallada abajo                                                                       | 201, `data`: UUID y definición persistida                                                    |
| 03-H | `GET /chat/admin/catalogos`                       | —                                                                                                                       | 200, `data`: `tipos_nodo[]`, `tipos_entrada[]`, `reglas_validacion[]`, `enums`               |

Flujos y nodos reutilizan los DTO existentes y conservan sus metadatos de creación
y ciclo de vida. Las transiciones del contrato nuevo exponen:

```text
data.id_regla: uuid
data.id_flujo: uuid
data.id_nodo_origen: uuid
data.id_nodo_destino: uuid
data.id_regla_validacion: uuid
data.operador_condicion: enum
data.valor_condicion: objeto JSON
data.orden_evaluacion: entero >= 1
data.fecha_creacion: timestamp
```

En 03-B se utiliza la misma representación de transición. El UUID de transición
se llama `id_regla` en este contrato; las rutas anteriores conservan
`id_transicion` y su regla anidada.

`valor_condicion` debe ser un objeto en las creaciones y ediciones del contrato
nuevo; null, arreglos y escalares se rechazan. La estructura interna por operador
no está definida en las HU suministradas y se conserva sin reinterpretarla. Las
lecturas no reescriben condiciones históricas guardadas con el formato anterior.

`data.enums` contiene las claves `modalidad`, `tipo_dependencia`, `tipo_craving`,
`operador_condicion`, `tipo_dato` y `estado_flujo`, cada una con un arreglo de los
literales existentes del dominio. Los catálogos de entidades provienen de la base.

## 03-G y flujo de reutilización

1. Crear la regla con `PATCH /chat/admin/reglas-validacion`.
2. Usar el UUID devuelto o consultarlo en `GET /chat/admin/catalogos`.
3. Referenciarlo en `id_regla_validacion` al crear o editar una transición.

La creación de una regla no exige un flujo. No se aceptan `id_flujo`, `creado_por`
ni un actor proporcionado por el cliente en ese body.

| Campo                | Tipo     | Comportamiento                                                        |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `tipo_dato`          | enum     | Obligatorio: TEXTO, NUMERICO, FECHA o SELECCION                       |
| `obligatorio`        | boolean  | Opcional; true por defecto; conserva false explícito                  |
| `valor_min`          | número   | Opcional; solo validación numérica; conserva cero                     |
| `valor_max`          | número   | Opcional; solo validación numérica; debe ser >= mínimo                |
| `formato_regex`      | string   | Opcional; solo texto; sintaxis válida                                 |
| `valores_permitidos` | string[] | Opcional; el tipo real PostgreSQL es text[]; SELECCION exige opciones |
| `mensaje_error`      | string   | Obligatorio, sin quedar vacío después de recortar espacios            |

Los límites y regex omitidos se representan como null y las opciones omitidas
como `[]`. Se conservan las validaciones de dominio existentes.

Esta operación corresponde a la configuración estructural de RF-25. Sus campos
preparan la obligatoriedad, el tipo, el rango, el formato y el mensaje que RF-28
necesita para validar respuestas. No ejecuta esa validación ni la navegación
de RF-29. La regla se referencia desde una transición; el operador y el objeto
de condición siguen definiendo la navegación por separado. RF-25C utiliza la
misma estructura para los árboles personalizados.

RF-28 tiene como actor al Sistema: el backend aplica la regla a las respuestas.
La configuración administrativa proviene de HU-03, no de una atribución adicional
hecha a RF-28. Se pueden reutilizar reglas preexistentes sin ejecutar 03-G por
cada transición; los RF no fijan un catálogo completo que deba estar precargado.
En este checkout no se encontró un caso de uso que procese respuestas e implemente
RF-28. Validar la coherencia de la definición al crearla no equivale a validar una
respuesta del estudiante. Esa ejecución no se agregó al alcance de HU-03.

Estas reglas configuran respuestas del chat. Las validaciones técnicas de DTO,
identificadores, permisos y campos obligatorios del API continúan definidas en
el código y no son modificables mediante 03-G. La ruta anterior de creación de
transiciones ya aceptaba una definición embebida desde la administración; se
conserva ese comportamiento y se agrega la creación independiente reutilizable.

Crear o seleccionar una regla no modifica otras definiciones. Las nuevas rutas
de transición sustituyen referencias únicamente en BORRADOR. La edición embebida
de las rutas anteriores copia la definición si está compartida, para conservar
las demás transiciones que la usan.

Ejemplo de petición:

```http
PATCH /chat/admin/reglas-validacion
Content-Type: application/json
X-CSRF-Token: <token de la sesión>

{
  "tipo_dato": "NUMERICO",
  "obligatorio": false,
  "valor_min": 0,
  "valor_max": 2.75,
  "mensaje_error": "Ingresa un número dentro del intervalo"
}
```

Ejemplo de respuesta, con UUID ilustrativo:

```json
{
  "data": {
    "id_regla_validacion": "00000000-0000-4000-8000-000000000006",
    "tipo_dato": "NUMERICO",
    "obligatorio": false,
    "valor_min": 0,
    "valor_max": 2.75,
    "formato_regex": null,
    "valores_permitidos": [],
    "mensaje_error": "Ingresa un número dentro del intervalo"
  }
}
```

## Auditoría exigida y decisión técnica adicional

La expresión «cada escritura» de HU-03 se refiere a las cinco operaciones
enumeradas: 03-A (CREAR_FLUJO), 03-C (CREAR_NODO), 03-D (EDITAR_NODO),
03-E (CREAR_TRANSICION) y 03-F (EDITAR_TRANSICION).
La especificación no exige auditar la creación independiente de reglas 03-G.

**Decisión técnica:** conservar también trazabilidad de la creación de una regla
reutilizable, para identificar su responsable y fecha aunque aún no esté
asociada a un árbol. Esta ampliación de diseño fue aceptada por el solicitante;
no se atribuye como obligación a HU-03 ni a RF-25. El evento adicional es
`CREAR_REGLA_VALIDACION`, dentro de `chat.auditoria_arboles`, con:

- `id_flujo = null`, porque la regla aún no pertenece a un árbol.
- `id_actor`: usuario autenticado, tomado de la sesión.
- `id_objeto`: UUID de la regla recién creada.
- Identificador y fecha de operación generados por PostgreSQL.

La regla puede reutilizarse en varias transiciones y árboles: registrar su
creación por separado evita atribuirla artificialmente a un flujo. No se registra
un evento por cada validación de respuesta. RF-38 trata las interacciones del
usuario y no constituye el fundamento de esta decisión administrativa.

La regla y su auditoría se crean en la misma transacción serializable. Si falla
cualquiera, no debe confirmarse ninguna de las dos escrituras.

La migración `20261017190000_auditoria_reglas_validacion_hu03` agrega la acción y
una restricción de ámbito: solo esta acción admite un flujo nulo y exige objeto;
las acciones existentes siguen exigiendo flujo. Se mantienen las FK, los eventos
anteriores y el trigger de inmutabilidad; no se agregan acciones de borrado.

**Esta versión de 03-G requiere que la migración figure aplicada en el historial
del entorno destino.** El historial debe revisarse antes de aplicar cambios;
no se debe utilizar un reset o db push para sustituir ese procedimiento.

## Dependencia real con HU-05

HU-05/RF-25B, a cargo de Juan, establece estos contratos backend:

- `GET /chat/admin/modalidad/elegibilidad?id_programa=...`.
- `POST /chat/admin/modalidad/habilitar-personalizada`, body `id_programa`.

Debe comprobar el 100% de perfiles completos de usuarios activos y los permisos,
registrar responsable y vigencia de la modalidad, y conservar las sesiones en
curso. El esquema incluye `chat.perfil_clinico`, `usuario.usuarios` y
`chat.tipo_terapia`, que contiene programa, modalidad, vigencias y responsable.

Crear un borrador PERSONALIZADA en HU-03 prepara la definición del árbol. No
habilita la modalidad de un programa, no cambia perfiles ni vigencias y no altera
sesiones. HU-05 no define el formato interno de condiciones de transición.

No se encontraron los dos endpoints de modalidad en este checkout. Su
implementación pertenece a HU-05 y no se agregó como parte de esta corrección.
Se conserva el versionado independiente por perfil clínico ya implementado:
primera versión 1, siguientes versiones incrementales.
