# RF-141 — Evolución temporal por unidad del cronograma

## Consulta

`GET /admin/cohortes/:id_cohorte/evolucion` requiere una sesión completa con rol `ADMINISTRATIVO`, conforme a RF-122. La cohorte y su cronograma deben estar activos. La respuesta aplica `Cache-Control: no-store`. M08 registra la consulta como `CONSULTA_AGREGADA` para el recurso `EVOLUCION_TEMPORAL_COHORTE` conforme a RF-123.

El cuerpo 200 contiene `id_cohorte`, `serie_unidades_temporales`, `serie_adherencia_promedio`, `serie_nivel_progreso_distribucion`, `serie_craving_promedio`, `unidades_con_datos_insuficientes` y `fecha_actualizacion`. Las tres series de indicadores tienen la misma longitud que la serie de unidades. Si la fuente confirma cero o una unidad transcurrida, se conserva el formato y se añade el `mensaje` funcional de RF-141.

Para las etiquetas, el frontend puede obtener `id_cronograma` de `GET /admin/cohortes/:id_cohorte` y consultar el catálogo de `GET /cronograma/obtener-unidades-temporales/:idCronograma`. La consulta existente del catálogo exige `X-CSRF-Token`. Su respuesta usa `idUnidadTemporal`, `nombreUnidadTemporal` y `orden`. La dimensión del eje sigue siendo la unidad temporal.

## Origen y validación

- `EvolucionSeguimientoPort.obtener(idCohorte)` consulta RF-78 con segmentación RF-55. El resultado identifica la cohorte y declara `ACTUALIZADO` o `NO_DISPONIBLE`. El resultado actualizado incluye `datos.fecha_actualizacion` (ISO 8601 con zona horaria), `datos.id_ultima_unidad_transcurrida` (UUID, o `null` antes de la primera unidad) y `datos.indicadores`.
- Cada fila de `indicadores` lleva `id_unidad_temporal`, `adherencia_promedio`, `nivel_progreso_distribucion` y `craving_promedio`. M05 entrega las métricas consolidadas y determina la última unidad transcurrida conforme a RF-55. M08 toma el tramo desde la primera unidad hasta esa posición usando `orden_unidad` del catálogo de Cronograma, sin usar fechas calendario para inferir la posición.
- Una unidad sin fila consolidada o con todos sus indicadores ausentes se incluye con `null` para adherencia y craving, `{}` para distribución y su UUID en `unidades_con_datos_insuficientes`. Los ceros se conservan. La proyección de la distribución admite solo niveles de RF-70 y omite niveles sin conteo.
- La consulta admite únicamente agregados de la cohorte solicitada. Los UUID repetidos, ajenos al tramo, una fecha inválida o métricas mal formadas hacen fallar la serie completa. Los campos individuales quedan fuera de la respuesta.
- Hay un límite de dos segundos para M05, igual que en las vistas agregadas existentes. Si falla la fuente, se responde `503` sin series ni respaldo. RF-141 utiliza el esquema vigente y no guarda snapshots.

| HTTP | Resultado |
| --- | --- |
| 200 | Serie ordenada, incluidos los estados funcionales sin datos o con menos de dos unidades transcurridas. |
| 400 | UUID inválido o `FILTROS_RF135_NO_DISPONIBLES` si se envían parámetros de consulta. |
| 401 / 403 | Sesión ausente, alcance insuficiente o rol distinto del autorizado. |
| 404 | `COHORTE_ACTIVA_NO_ENCONTRADA`. |
| 503 | `SEGUIMIENTO_NO_DISPONIBLE`. La respuesta solo incluye información del error. |
| 500 | `ERROR_CONSTRUCCION_SERIE_TEMPORAL` o `ERROR_REGISTRO_AUDITORIA`. |

## Dependencias

M05 aún debe conectar su proveedor temporal de RF-78. El enlace actual informa indisponibilidad. RF-135 se incorporará cuando exista su contrato integrado y la fuente pueda aplicar rango de fechas y modalidad. Hasta entonces, la consulta base sigue disponible para un proveedor temporal y rechaza filtros explícitos para evitar presentar datos generales como filtrados.

## Pruebas

`test/administrativo/evolucion-temporal-rf141.e2e-spec.ts` usa PostgreSQL local y un proveedor M05 simulado. Requiere `RF141_TEST_DATABASE_URL` en una base desechable `brisa_rf141_*` en `127.0.0.1`.
