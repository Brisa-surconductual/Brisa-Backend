# Contrato backend HU-05 / RF-25C — Gestión de flujos personalizados

Esta tarea usa la identificación HU-05 para RF-25C. La habilitación de modalidad
de un programa pertenece a RF-25B y no se implementa ni se modifica aquí.

Se reutiliza HU-03. Las rutas requieren sesión COMPLETA y rol ADMINISTRATIVO,
que representa al equipo autorizado de psicología en este backend. Las escrituras
exigen CSRF y toman al actor de la sesión. No se incorpora un rol nuevo.

## Diagnóstico y reutilización

| Referencia    | Implementación previa                                           | Ajuste para el contrato nuevo                                                                      |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Creación 03-A | Creación personalizada y versionado por perfil                  | Se conserva el endpoint y se amplían las pruebas de campos clínicos                                |
| 05-A          | Historial exclusivo de personalizados, sin paginación           | Listado general con filtros, conteo y paginación                                                   |
| 05-B          | Clonación personalizada con siguiente versión del perfil        | Se comparte la copia transaccional; contrato nuevo usa origen + 1 y conserva referencias de reglas |
| 05-C          | Publicación personalizada con archivado automático del anterior | El contrato nuevo rechaza el conflicto; reutiliza validación de grafos, auditoría e índice parcial |
| 05-D          | Archivado personalizado                                         | Ruta general para ambas modalidades, con estado y respuesta documentados                           |

## Creación reutilizada

`POST /chat/admin/flujos` mantiene el contrato de HU-03. Para PERSONALIZADA,
`tipo_dependencia` y `tipo_craving` son obligatorios y deben ser enums válidos;
su ausencia o un valor inválido devuelve 400 antes de persistir.

- Dependencia: ABSTINENCIA_FISICA o TOLERANCIA.
- Craving: POSITIVO o NEGATIVO.
- Estado inicial: BORRADOR.
- Versiones positivas y únicas dentro de cada combinación personalizada.
- Se permiten varios borradores de un perfil, con versiones diferentes.
- La creación inicial asigna la siguiente versión del perfil y registra CREAR_FLUJO.

## 05-A — Listado

`GET /chat/admin/flujos`

Filtros opcionales: `modalidad`, `tipo_dependencia`, `tipo_craving`, `estado`.
Se combinan mediante AND y se validan contra los enums existentes.

`page` es un entero positivo, predeterminado 1. `page_size` es un entero entre
1 y 100, predeterminado 20. Se rechazan campos desconocidos, arreglos, decimales
y valores fuera del rango entero representable para calcular la paginación.

Respuesta 200:

```json
{
  "data": { "items": [] },
  "meta": { "page": 1, "page_size": 20, "total": 0 }
}
```

Cada elemento usa el DTO de flujo de HU-03, incluidas modalidad, perfil, estado,
versión, creador y las tres fechas de ciclo de vida. El total corresponde al
conjunto filtrado antes de paginar. Orden: fecha de creación descendente y UUID
ascendente como desempate. Conteo y página se leen en la misma transacción.

## 05-B — Clonación

`POST /chat/admin/flujos/{id_flujo}/clonar-version`, body vacío, respuesta 201.

`data` contiene `id_flujo`, `id_flujo_origen`, `version`, `estado`,
`nodos_copiados` y `transiciones_copiadas`.

Se admite origen PUBLICADO o ARCHIVADO, conservando la regla previa del dominio.
El clon recibe UUID nuevo y estado BORRADOR. Conserva modalidad, perfil, nombre,
contenido y referencias a cronograma; obtiene sus propias fechas y creador.
Los nodos y transiciones reciben identificadores nuevos, con origen y destino
remapeados. Se conservan las referencias a reglas reutilizables, sus condiciones
y el orden de evaluación; no se crean reglas nuevas innecesariamente.

La versión es exactamente la versión del origen + 1. Si esa versión ya está
ocupada en la combinación personalizada, se devuelve 409 mediante el conflicto
de versión existente. No se renumera ni se elimina la unicidad histórica.
No existe una familia o linaje adicional en el modelo: no se inventa una
restricción de versión para grupales.

La copia completa y CLONAR_VERSION son atómicas. La auditoría identifica al clon
como flujo afectado y al origen como objeto.

## 05-C — Publicación

`POST /chat/admin/flujos/{id_flujo}/publicar`, body vacío, respuesta 200.

`data`: `id_flujo`, `estado`, `version`, `fecha_publicacion`.

Solo admite BORRADOR; otro estado devuelve 409 ESTADO_INVALIDO. Se reutilizan
el recorrido de alcanzabilidad y la detección de ciclos del dominio. La
publicación inválida devuelve 422 GRAFO_INVALIDO con:

```json
{
  "detalles": {
    "nodos_huerfanos": [],
    "ciclos": [],
    "sin_nodo_inicial": false
  }
}
```

Los nodos huérfanos se identifican por UUID. Cada ciclo es un recorrido de UUID
que termina en el nodo de cierre. La ausencia de un único nodo inicial se indica
con `sin_nodo_inicial`. Los códigos, mensajes y detalles están en la raíz del
error HTTP, conforme al manejo de excepciones del proyecto.

Si otro personalizado está publicado para el mismo perfil, se devuelve 409
YA_EXISTE_PUBLICADO con `detalles.id_flujo_publicado`. No se archiva el anterior
desde esta ruta. La comprobación y PUBLICAR se ejecutan en una transacción
serializable; el índice único parcial impide dos publicaciones concurrentes y
el conflicto se traduce consultando el UUID ganador fuera de la transacción fallida.

**Diferencia entre fuentes:** el RF-25C original exige archivar automáticamente
el publicado anterior. La solicitud actual exige rechazarlo. Se aplica esta
última regla en `/chat/admin`; las rutas anteriores de
`/chat/administracion/arboles-personalizados` conservan el reemplazo automático,
su respuesta previa y sus consumidores. No se presenta como un cambio del RF
original ni se modifica silenciosamente el contrato anterior.

## 05-D — Archivado

`POST /chat/admin/flujos/{id_flujo}/archivar`, body vacío, respuesta 200.

`data`: `id_flujo`, `estado`, `fecha_archivado`.

Se permiten BORRADOR → ARCHIVADO y PUBLICADO → ARCHIVADO, como en el comportamiento
existente. Repetir el archivado devuelve 409 ESTADO_INVALIDO. Se preservan las
fechas históricas, los nodos y las transiciones. La actualización y ARCHIVAR son
atómicos. Al archivar un publicado se libera la combinación para publicar otro.

## Base de datos, compatibilidad y pruebas

La inspección de solo lectura confirmó los índices
`uq_flujo_publicado_personalizada`, `uq_flujo_version_personalizada` y
`uq_flujo_publicado_grupal`, además de la coherencia clínica y la versión positiva.
No se encontraron publicados personalizados duplicados. No se necesita una
migración nueva ni se cambia el índice grupal previo; la validación clínica de
unicidad se aplica exclusivamente a PERSONALIZADA.

No se modifican sesiones, selección de árboles de RF-26B ni configuración de
modalidad de RF-25B. Se conservan las consultas anteriores de árbol publicado.

Pruebas HTTP: `pnpm test:e2e:chat`. Pruebas unitarias de Chat:
`pnpm exec jest --runInBand --testPathPatterns modules/chat`.

Integración aislada: `node test/chat/integration/gestion-flujos-hu05.cjs`.
Requiere PostgreSQL 18 local; `HU05_PG_BIN` permite indicar una ruta absoluta
distinta a la instalación predeterminada. Crea un clúster nuevo, usuario de
prueba, puerto local y contraseña aleatoria. No carga el env del proyecto.
Usa un esquema mínimo de fixtures y las migraciones de auditoría existentes;
comprueba operaciones reales, índices, concurrencia y rollback. No sustituye
una prueba de aprovisionamiento de toda la base desde el historial de migraciones.
