# RF-133 y RF-134 — Vistas agregadas de cohorte

## Operaciones

| RF | Ruta | Fuente |
| --- | --- | --- |
| RF-133 | `GET /admin/cohortes/:id_cohorte/vistas/narrativa` | M06, RF-117, `NarrativaAgregadaPort` |
| RF-134 | `GET /admin/cohortes/:id_cohorte/vistas/notificaciones` | M07, RF-101, `NotificacionesAgregadasPort` |

Las rutas requieren cookie de sesión completa y rol `ADMINISTRATIVO`, conforme a RF-122. La cohorte solicitada y su cronograma deben estar activos. Cada consulta usa `Cache-Control: no-store` y se audita como `CONSULTA_AGREGADA` con el recurso correspondiente. El respaldo y la auditoría de una consulta exitosa se escriben en la misma transacción. Una consulta degradada se registra como `FALLIDA` antes de devolver el 503, incluso si se puede mostrar una copia.

La envoltura contiene `id_cohorte`, `estado`, `estado_agregacion`, `ultimo_timestamp_disponible`, `motivo_sin_datos`, `mensaje` y `datos`.

| HTTP | Estado | Agregación | Motivo | Datos |
| --- | --- | --- | --- | --- |
| 200 | `DISPONIBLE` | `ACTUALIZADO` | `null` | Consolidado de la fuente. |
| 200 | `NO_DISPONIBLE` para narrativa, `DISPONIBLE` para notificaciones | `PENDIENTE` | `SIN_CONSOLIDAR` | `null`. |
| 200 | `NO_DISPONIBLE` | `ACTUALIZADO` | `AGREGADO_SUPRIMIDO` | `null` si la fuente declara supresión. |
| 503 | `DESACTUALIZADA` | `ERROR_ACTUALIZACION` | `null` | Última copia válida de la vista solicitada. |
| 503 | `NO_DISPONIBLE` | `ERROR_ACTUALIZACION` | `null` | `null` si falta una copia válida. |

Un UUID inválido devuelve 400. Una sesión ausente devuelve 401 y una sesión sin acceso suficiente devuelve 403. Una cohorte no elegible devuelve 404 `COHORTE_ACTIVA_NO_ENCONTRADA`. Una respuesta con identidad inconsistente o sin una fecha válida devuelve 500 `ERROR_CONSULTA_VISTA_AGREGADA`. Si falla la auditoría de una consulta, devuelve 500 `ERROR_REGISTRO_AUDITORIA`.

## Datos y decisiones de contrato

- **Narrativa.** Proyecta la distribución `{ fase, total }` para `INICIO`, `DESARROLLO` y `CIERRE`, los totales de usuarios que completaron el programa y que tienen logros, y el total de logros desbloqueados. El Excel de RF-133 también especifica `total_usuarios_cohorte` y `fecha_actualizacion`, que el frontend ya puede leer.
- **Notificaciones.** Proyecta tasas promedio de apertura y conversión, los totales de enviadas, entregadas y descartadas, y `fecha_actualizacion` según RF-134. Un consolidado sin envíos entrega sus tres totales en `0` y sus dos tasas en `null`. Una cohorte sin consolidado devuelve el cuerpo `PENDIENTE` con `datos: null`.
- Los puertos consultan un agregado existente en su fuente. M08 conserva sus cifras y precisión. Los perfiles excluidos y las métricas no calculables los trata su módulo de origen. M08 proyecta únicamente campos agregados, conserva las métricas nulas y omite datos individuales.
- La fecha ISO 8601 de la fuente permanece en `datos.fecha_actualizacion`. La envoltura la expresa en UTC. El respaldo se guarda por `(id_cohorte, vista)` en `administrativo.snapshots_vista`, con el esquema existente. Las consultas tienen un límite de 2 segundos por fuente.
- El Excel no define un contrato de transporte para RF-117 ni RF-101. Los puertos y sus pruebas están implementados en M08. Los valores por defecto registran la fuente como indisponible hasta conectar las implementaciones reales de M06 y M07. El uso del 503 con cuerpo corresponde al flujo alterno de los dos RF.

## Verificación

La suite `test/administrativo/vista-conductual-rf132.e2e-spec.ts` cubre las tres vistas. Requiere una base PostgreSQL desechable con prefijo `brisa_rf132_` en `localhost` y la variable `RF132_TEST_DATABASE_URL`. Usa un mock independiente para cada módulo fuente.
