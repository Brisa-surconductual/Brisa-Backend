# RF-124 — Gestión de cohortes

## Estado

APROBADA. Implementación en `feat/administrativo-gestion-cohortes-rf124`.

## Operación y acceso

| Método y ruta | Operación | Éxito |
| --- | --- | --- |
| `POST /admin/cohortes` | Crear una cohorte en `BORRADOR` | 201 |
| `PATCH /admin/cohortes/:id_cohorte` | Editar los datos, activar, inactivar o reactivar | 200 |

Las escrituras requieren cookie de sesión, alcance `COMPLETA`, rol
`ADMINISTRATIVO` y el encabezado `X-CSRF-Token`.

## Solicitud

El alta requiere `nombre_cohorte` (1 a 150 caracteres tras recortar espacios),
`fecha_inicio_programa` y `fecha_fin_programa` (`YYYY-MM-DD`) e
`id_cronograma` (UUID). La fecha final puede coincidir con la inicial.

El PATCH admite esos mismos cuatro campos y `estado`. Debe incluir al menos
un campo. Conserva los valores omitidos y valida el período resultante. El
estado explícito solicita una transición. Para editar conservando el estado,
se omite ese campo.

## Respuesta

```json
{
  "id_cohorte": "uuid",
  "nombre_cohorte": "Cohorte noviembre",
  "fecha_inicio_programa": "2026-11-23",
  "fecha_fin_programa": "2026-12-23",
  "id_cronograma": "uuid",
  "estado": "BORRADOR",
  "fecha_actualizacion": "2026-11-23T14:00:00.000Z"
}
```

| HTTP | Caso |
| --- | --- |
| 400 | DTO o UUID inválidos, `COHORTE_SIN_CAMBIOS`, `FECHAS_COHORTE_INVALIDAS` |
| 401 / 403 | Sesión ausente o acceso denegado por alcance, rol o CSRF |
| 404 | `COHORTE_NO_ENCONTRADA` o `CRONOGRAMA_NO_ENCONTRADO` |
| 409 | `TRANSICION_COHORTE_INVALIDA` o `NOMBRE_COHORTE_DUPLICADO` |
| 422 | `CRONOGRAMA_NO_ACTIVO` |
| 500 | `ERROR_PERSISTENCIA_COHORTE` o `ERROR_REGISTRO_AUDITORIA` |

## Reglas y decisiones

- Las transiciones admitidas por el trigger vigente son `BORRADOR → ACTIVA`,
  `ACTIVA → INACTIVA` e `INACTIVA → ACTIVA`. La demostración del frontend solo
  ofrece las primeras dos. Cualquier cambio de esa política requiere alinear
  el contrato y el trigger.
- Solicitar el estado actual devuelve 409. PostgreSQL también exige nombres
  únicos entre cohortes sin eliminación lógica, incluso si están inactivas.
- Crear, editar datos y pasar a `ACTIVA` requieren un cronograma activo.
  El puerto de Cronograma comprueba su estado dentro de la transacción y
  conserva el bloqueo del cronograma hasta confirmar. Una inactivación que
  solo cambia el estado no vuelve a validar el cronograma.
- El cambio y la auditoría `GESTION_COHORTE` se confirman en la misma
  transacción. El detalle distingue `CREAR`, `EDITAR`, `ACTIVAR` e
  `INACTIVAR`. La identidad del actor proviene de la sesión.
- El contrato del listado y el detalle de cohortes queda pendiente para
  conectar el frontend, que actualmente usa datos de demostración. El selector
  puede reutilizar `GET /cronograma/obtener-cronogramas` de M04 y filtrar los
  cronogramas activos. Este contrato cubre las dos escrituras solicitadas.

## Trazabilidad

- RF-124, hoja «MO8- Administrativo». Dependencias RF-19, RF-122 y RF-123.
- Pruebas HTTP y PostgreSQL en `test/administrativo/cohortes-rf124.e2e-spec.ts`.
