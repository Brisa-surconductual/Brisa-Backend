# RF-132 — Vista agregada conductual

## Estado

IMPLEMENTADA en M08. El puerto se verifica con un mock de M05. El proveedor real de RF-78 y la conexión del frontend quedan pendientes de integración.

## Operación y acceso

`GET /admin/cohortes/:id_cohorte/vista-agregada` recibe el UUID de la cohorte por ruta. Requiere cookie de sesión completa y rol `ADMINISTRATIVO`. La cohorte y su cronograma deben estar activos. La respuesta usa `Cache-Control: no-store`.

## Respuesta

La vista disponible conserva los valores consolidados de RF-78.

```json
{
  "id_cohorte": "b07f4f42-7dd6-41bd-ae49-5a99924005a9",
  "estado": "DISPONIBLE",
  "estado_agregacion": "ACTUALIZADO",
  "ultimo_timestamp_disponible": "2026-11-23T11:10:00.000Z",
  "motivo_sin_datos": null,
  "mensaje": null,
  "datos": {
    "total_usuarios_activos": 3,
    "distribucion_niveles_progreso": [{ "nivel": "INICIAL", "total_usuarios": 2 }],
    "tasa_adherencia_promedio": 0.7342184,
    "alertas_inactividad_pendientes": 0,
    "alertas_craving_pendientes": 1,
    "fecha_actualizacion": "2026-11-23T06:10:00-05:00"
  }
}
```

| HTTP | Estado | Estado de agregación | Motivo | Datos |
| --- | --- | --- | --- | --- |
| 200 | `DISPONIBLE` | `ACTUALIZADO` | `null` | Agregado vigente. |
| 200 | `NO_DISPONIBLE` | `PENDIENTE` | `SIN_CONSOLIDAR` | `null`. |
| 200 | `NO_DISPONIBLE` | `ACTUALIZADO` | `AGREGADO_SUPRIMIDO` | `null` cuando la fuente declara supresión. |
| 503 | `DESACTUALIZADA` | `ERROR_ACTUALIZACION` | `null` | Última vista válida de esa cohorte. |
| 503 | `NO_DISPONIBLE` | `ERROR_ACTUALIZACION` | `null` | `null` cuando falta una copia utilizable. |

El frontend debe interpretar el cuerpo del 503 con la misma envoltura del 200 para presentar la copia desactualizada. En los estados sin datos, `ultimo_timestamp_disponible` es `null`.

| HTTP | Caso |
| --- | --- |
| 400 | UUID inválido. |
| 401 / 403 | Sesión ausente o rol/alcance insuficiente. |
| 404 | `COHORTE_ACTIVA_NO_ENCONTRADA`. La cohorte no existe, fue eliminada o no está activa con un cronograma activo. |
| 500 | `ERROR_CONSULTA_VISTA_AGREGADA` si no se puede validar o procesar la vista. `ERROR_REGISTRO_AUDITORIA` si falla el registro de una consulta exitosa. |

## Reglas y decisiones

- `SeguimientoAgregadoPort.obtener(idCohorte)` consulta el resultado consolidado de RF-78. El resultado identifica la cohorte y declara `ACTUALIZADO`, `PENDIENTE`, `SUPRIMIDO` o `NO_DISPONIBLE`. M08 verifica que el identificador devuelto sea el solicitado. El puerto dispone de 2 segundos para responder antes de usar el respaldo.
- Se reutilizan los nombres esperados por el frontend para la distribución, `nivel` y `total_usuarios`. Sus niveles son `INICIAL`, `EN_AVANCE`, `AVANZADO` y `COMPLETADO` (RF-70). La adherencia se transmite en la escala y con la precisión entregadas por M05. Los valores numéricos ausentes o inválidos quedan en `null`.
- La proyección se limita a campos agregados permitidos. Solo se guarda esa proyección en `administrativo.snapshots_vista` para `CONDUCTUAL`. La fecha del indicador se conserva en los datos y se expresa en UTC en la envoltura.
- Una versión antigua no reemplaza una más reciente. Una supresión explícita reemplaza la copia con una marca sin métricas y protege frente a respuestas anteriores que todavía estén en curso.
- La consulta se registra con `CONSULTA_AGREGADA` conforme a RF-123. La copia y la auditoría exitosa se guardan en la misma transacción.
- Se usa el esquema existente. El umbral propuesto `N < 5` requiere aprobación de Psicología. Hasta entonces, M08 solo reconoce supresión si la fuente la declara.

## Trazabilidad

- RF-132 y RF-78 de `Especificacion Requerimientos (1).xlsx`. Dependencias de acceso y auditoría RF-122 y RF-123, y de cohorte activa RF-124.
- El Excel no especifica el transporte de RF-78. El proveedor por defecto informa indisponibilidad hasta conectar M05. El mock solo se usa en pruebas.
- Rama `feat/administrativo-vista-conductual-rf132` y suite `test/administrativo/vista-conductual-rf132.e2e-spec.ts`.
