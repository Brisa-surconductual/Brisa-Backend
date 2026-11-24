# RF-140 — Dashboard principal

## Consulta

`GET /admin/dashboard` exige una sesión completa con rol `ADMINISTRATIVO` (RF-122), como RF-132, RF-133 y RF-134. La respuesta envía `Cache-Control: no-store`.

El panel identifica una única cohorte en estado `ACTIVA` con cronograma activo. La consulta usa la cohorte vigente de RF-124 y valida que siga siendo la misma antes de entregar las métricas. Se registra `CONSULTA_AGREGADA` con el recurso `DASHBOARD_PRINCIPAL_COHORTE` y la cohorte, si se pudo identificar. La auditoría es síncrona. Si la bitácora falla, se devuelve el error de auditoría y se omiten los datos del panel.

## Respuesta

- `id_cohorte` contiene el UUID de la cohorte. Es `null` en el estado funcional sin cohorte.
- `vista_conductual`, `vista_narrativa` y `vista_notificaciones` contienen directamente los contratos de RF-132, RF-133 y RF-134. Cada `estado` expresa su disponibilidad y cada `ultimo_timestamp_disponible` indica la fecha de los datos. Las tres propiedades son `null` en el estado funcional sin cohorte.
- `total_alertas_criticas_pendientes` suma las alertas pendientes de inactividad y craving de la vista conductual. Vale `null` si falta uno de los conteos válidos y preserva el cero cuando ambos conteos valen cero. El total comparte la vigencia de `vista_conductual`.
- `fecha_carga_pantalla` es la hora de generación de la respuesta en ISO 8601 UTC.
- `estado`, `mensaje` y `advertencias` permiten distinguir la respuesta funcional, la degradación y los errores. `advertencias` incluye un aviso por cada sección afectada en un resultado parcial.

| HTTP | Estado o código |
| --- | --- |
| 200 | `DISPONIBLE` con fuentes que respondieron, incluidas vistas pendientes de consolidación o suprimidas por el contrato de origen. |
| 200 | `PARCIAL` cuando alguna fuente falla. Las vistas restantes conservan su contenido. |
| 200 | `SIN_COHORTE_ACTIVA` con el mensaje que orienta a la gestión de cohortes de RF-124. |
| 401 / 403 | Sesión ausente o acceso denegado por los mecanismos de RF-122. |
| 409 | `COHORTE_ACTIVA_AMBIGUA` si existe más de una cohorte activa elegible. `COHORTE_ACTIVA_CAMBIO` si la selección cambia durante la consulta. |
| 503 | `FUENTES_DASHBOARD_NO_DISPONIBLES`, con el mismo cuerpo del panel y estado `DESACTUALIZADO` si hay un respaldo, o `NO_DISPONIBLE` si falta. |
| 500 | `ERROR_CONSULTA_DASHBOARD` o `ERROR_REGISTRO_AUDITORIA`. |

Las consultas se inician en paralelo con `Promise.allSettled` y conservan el límite de dos segundos por proveedor de las vistas existentes. Los respaldos vienen de `administrativo.snapshots_vista`, separados por cohorte y vista. RF-140 utiliza la proyección y la política de supresión de cada contrato de origen. No requiere una migración ni una tabla de caché propia.

## Decisiones y dependencias

El esquema de RF-124 permite varias cohortes activas y RF-140 no establece precedencia. La respuesta `409` evita seleccionar una de forma implícita. Para el estado funcional sin cohorte y los conteos ausentes, el contrato HTTP admite `null`; así la ausencia se distingue de un total de cero. La aplicación cliente puede usar `SIN_COHORTE_ACTIVA` para enlazar a la gestión existente de RF-124.

La respuesta reutiliza los puertos de M05 (RF-78), M06 (RF-117) y M07 (RF-101). Los proveedores reales siguen pendientes. Con la configuración actual y sin un respaldo previamente guardado, una cohorte activa recibe el estado `NO_DISPONIBLE` con HTTP 503.

La integración HTTP del dashboard, el enlace y los límites de errores por sección corresponden al frontend.

## Pruebas

`test/administrativo/dashboard-principal-rf140.e2e-spec.ts` verifica el contrato HTTP con PostgreSQL local y tres proveedores simulados. Usa `RF140_TEST_DATABASE_URL` en una base local desechable `brisa_rf140_*`.
