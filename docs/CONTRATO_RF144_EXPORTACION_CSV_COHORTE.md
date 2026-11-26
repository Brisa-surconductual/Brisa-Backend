# RF-144 — Exportación CSV de indicadores agregados

## Consulta

`GET /admin/cohortes/:id_cohorte/exportacion.csv` requiere sesión completa con rol `ADMINISTRATIVO`. El identificador es el UUID de RF-124. La ficha de RF-144 (versión 1.0.0) indica `Integer`; el esquema, las rutas y el SSD utilizan UUID.

La cohorte solicitada debe estar activa y asociada a un cronograma activo. La consulta reutiliza las vistas RF-132 y RF-134 y sus proyecciones. Las métricas conservan los valores y fechas publicados por esas vistas. Cuando una vista entrega un respaldo, su columna de estado indica `DESACTUALIZADA`. RF-132 requiere datos consolidados. RF-134 puede faltar, en cuyo caso su estado es `NO_DISPONIBLE` y sus indicadores se escriben como `No disponible`. El cero se conserva.

## Archivo

- `Content-Type: text/csv; charset=utf-8` y `Content-Disposition: attachment; filename="indicadores_cohorte_activa_YYYYMMDD.csv"`. La fecha del nombre usa `America/Bogota`. El servidor expone `Content-Disposition` a los orígenes CORS autorizados.
- El archivo contiene un encabezado fijo de 18 columnas y una fila de datos con el nombre de la cohorte, los indicadores de conducta y de notificaciones y el estado y fecha de cada vista. Aplica RFC 4180 con comas, comillas duplicadas y terminadores CRLF. El BOM UTF-8 permite abrirlo en Excel. Los números conservan el punto decimal y su precisión.
- La lista blanca se aplica en el servidor. El CSV excluye los campos de participantes, identificadores y seudónimos, así como cualquier campo adicional de las fuentes. Los nombres que podrían interpretarse como fórmula se neutralizan al escribir el CSV.
- `include_pii=true` y los selectores `fields`, `columns` o `columnas` se ignoran. Se emite un aviso WARN con el ID del actor autenticado y de la cohorte. Una exportación que cumple los demás requisitos devuelve el mismo archivo con HTTP 200.

## Auditoría y estados

Se registra `EXPORTACION_DATOS` para `EXPORTACION_CSV_COHORTE` en la bitácora de RF-123. El registro incluye usuario, sesión, IP, cohorte, marca temporal, estado, nombre del archivo y tamaño en bytes. En intentos fallidos o denegados, los metadatos aún desconocidos se guardan como `null`. Si falla el registro síncrono, se aborta la descarga antes de enviar el archivo. Se vuelve a comprobar la cohorte activa en esa transacción.

| HTTP | Caso |
| --- | --- |
| 200 | Archivo CSV válido, incluida la respuesta degradada sin notificaciones. |
| 400 | UUID inválido. |
| 401 | Sesión ausente o expirada. |
| 403 | `ACCESO_DENEGADO`. |
| 422 | `COHORTE_NO_ACTIVA` si la cohorte no existe o no está activa. |
| 422 | `SIN_INDICADORES_CONSOLIDADOS` si RF-132 está pendiente o suprimida. |
| 500 | `ERROR_GENERACION_CSV` si falla la vista obligatoria sin respaldo o no se puede generar el archivo. |
| 500 | `ERROR_REGISTRO_AUDITORIA` si no se puede registrar la consulta o la exportación. |

El endpoint reutiliza el esquema vigente y la política de respaldos de las vistas. Para exportar métricas reales se necesita el proveedor conductual de M05 (RF-78) o un respaldo válido. M07 (RF-101) se conecta para incluir notificaciones reales. La conexión del botón del frontend al endpoint queda pendiente.

## Verificación local

`test/administrativo/exportacion-csv-rf144.e2e-spec.ts` requiere `RF144_TEST_DATABASE_URL` con una base desechable `brisa_rf144_*` en `127.0.0.1`. Las fuentes se simulan y la bitácora usa PostgreSQL local.
