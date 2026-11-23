# RF-125 — Participantes de una cohorte

## Estado

IMPLEMENTADA en backend. La conexión del frontend a estas rutas queda como integración posterior.

## Operación y acceso

Se requiere sesión completa con rol `ADMINISTRATIVO`. El POST y DELETE reciben `X-CSRF-Token`. Las respuestas usan `Cache-Control: no-store`.

| Método y ruta | Éxito | Respuesta |
| --- | --- | --- |
| `GET /admin/cohortes/:id_cohorte/participantes` | 200 | Arreglo de `ParticipanteCohorte` ordenado por código. Incluye membresías retiradas como `INACTIVO`. |
| `GET /admin/cohortes/:id_cohorte/participantes/elegibles` | 200 | Arreglo de `{ "codigo_participante": "P-..." }` ordenado por código. |
| `POST /admin/cohortes/:id_cohorte/participantes` | 201 | Arreglo de `ParticipanteCohorte` asignados, ordenado por código. |
| `DELETE /admin/cohortes/:id_cohorte/participantes/:codigo_participante` | 200 | `ParticipanteCohorte` con estado `INACTIVO`. |

## Solicitud y respuesta

El POST requiere un arreglo no vacío de códigos distintos. Los códigos deben corresponder a estudiantes.

```json
{ "codigos_participante": ["P-0A1B2C3D", "P-1E2F3A4B"] }
```

Ejemplo de `ParticipanteCohorte`.

```json
{
  "codigo_participante": "P-0A1B2C3D",
  "estado": "PENDIENTE_VALIDACION",
  "estado_registro": "COMPLETO",
  "estado_consentimiento": "ACEPTADO",
  "estado_linea_base": "NO_REGISTRADA",
  "motivos_pendiente": ["LINEA_BASE_NO_REGISTRADA"]
}
```

| HTTP | Código | Caso |
| --- | --- | --- |
| 400 | Validación estándar | UUID o código con formato inválido, arreglo ausente, vacío o con repetidos. |
| 401 / 403 | Guardas de sesión y CSRF | Sesión ausente, rol/alcance insuficiente o CSRF inválido. |
| 404 | `COHORTE_NO_ENCONTRADA` | Cohorte inexistente o eliminada. |
| 404 | `PARTICIPANTE_NO_ENCONTRADO` | Algún código del lote no corresponde a un estudiante. |
| 404 | `PARTICIPANTE_NO_ASIGNADO` | No hay una membresía vigente que retirar para ese código. |
| 409 | `PARTICIPANTE_YA_ASIGNADO` | Ya existe una membresía vigente en la misma cohorte. |
| 409 | `PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA` | La asignación o reactivación dejaría una membresía vigente en dos cohortes activas. |
| 422 | `COHORTE_NO_ACTIVA` | La cohorte destino no admite asignaciones en su estado actual. |
| 422 | `PARTICIPANTE_NO_CUMPLE_REQUISITOS` | PostgreSQL impidió que quedara activo al validar los requisitos en la escritura. |
| 500 | `ERROR_REGISTRO_AUDITORIA` / `ERROR_PERSISTENCIA_PARTICIPANTES` | Fallo de auditoría o persistencia. Se revierte la transacción. |

## Reglas y decisiones

- El listado consulta `administrativo.v_cohorte_participantes_validacion`. Se exponen el código y los estados de validación. El correo y los UUID internos del estudiante y de la membresía quedan fuera de la respuesta.
- La consulta de elegibles genera el seudónimo al necesitarlo y conserva el código en consultas futuras. Son elegibles para **asignación** los estudiantes sin membresía vigente en esa cohorte ni en otra activa. Pueden tener requisitos pendientes. Una cohorte existente que no esté activa devuelve un catálogo vacío.
- El POST asigna en `ACTIVO` con registro completo, consentimiento aceptado y línea base registrada. En caso contrario, confirma la asignación como `PENDIENTE_VALIDACION` con sus motivos. El 422 del Excel se refiere al intento de dejar activo a quien no cumple, no al alta en estado pendiente.
- El lote es atómico. Si se encuentra un conflicto de asignación, se devuelve ese 409 con `detalles.codigo_participante` y se revierte el lote. Comparte el bloqueo por estudiante con el retiro y la reactivación de una cohorte. El retiro registra la fecha y cambia la membresía a `INACTIVO`. Una reasignación reutiliza la fila y conserva el historial de estados.
- RF-123 registra las consultas y las operaciones de gestión. La auditoría individual de asignación y retiro se guarda en la misma transacción que la membresía y su historial.

## Trazabilidad

- RF-125, hoja MO8 - Administrativo de `Especificacion Requerimientos (1).xlsx`, y contrato POST de la HU. Dependencias directas de acceso y auditoría en RF-122 y RF-123, y de cohorte en [RF-124](CONTRATO_RF124_GESTION_COHORTES.md).
- Como la HU solo fija la ruta de asignación, se definieron aquí el listado, el catálogo de elegibles y el retiro por seudónimo.
- RF-19 puede consumir el estado de los participantes. Queda por definir cómo identifica la cohorte al activar un cronograma y cómo se promueve una membresía previamente pendiente cuando cumple los requisitos.
- Rama `feat/administrativo-participantes-cohorte-rf125`. Migración `20261123230000_participantes_cohorte_rf125` y pruebas HTTP en `test/administrativo/participantes-cohorte-rf125.e2e-spec.ts`.
