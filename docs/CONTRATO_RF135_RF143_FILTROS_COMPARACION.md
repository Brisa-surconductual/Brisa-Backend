# RF-135 y RF-143 — Filtros y comparación de cohortes

## RF-135 · Filtros de las vistas agregadas

Las rutas usan la sesión completa y los roles de RF-132 a RF-134, `ADMINISTRATIVO` y `COORDINADOR_PSI`.

- `GET /admin/cohortes/:id_cohorte/vistas` admite `vista_objetivo=CONDUCTUAL|NARRATIVA|NOTIFICACIONES|TODAS`. El valor predeterminado es `TODAS`. La respuesta contiene `filtros_aplicados` con la selección normalizada y `vistas` con un sobre independiente por vista. `TODAS` consulta en paralelo. Una fuente indisponible o una proyección inválida solo afecta su propia entrada.
- `GET /admin/cohortes/:id_cohorte/vistas/{conductual|narrativa|notificaciones}` conserva el sobre de la vista y añade sus filtros aplicados, omitidos y una advertencia cuando corresponde. El alias conductual previo, `/vista-agregada`, admite también los filtros y conserva su respuesta base para consultas sin filtros.
- `fecha_inicio` y `fecha_fin` usan `YYYY-MM-DD`. Se admite un límite sin el otro y un rango de un día. Fechas inválidas o invertidas devuelven `400 RANGO_FECHAS_INVALIDO`.
- `id_unidad_temporal` debe pertenecer al cronograma de la cohorte activa. En caso contrario devuelve `404 UNIDAD_TEMPORAL_NO_ENCONTRADA`.
- `modalidad_terapeutica` acepta `GRUPAL`, `PERSONALIZADA` o `TODAS`. `TODAS` equivale a consultar sin restricción de modalidad.
- Cada puerto anuncia `filtrosSoportados`. El backend reenvía solo la intersección con la selección y devuelve las omisiones por vista. Un proveedor que todavía no anuncia capacidades omite los filtros. `PENDIENTE` ante una selección vigente devuelve `200` con el mensaje funcional de ausencia de datos. Una consulta individual cuya fuente no responde conserva el `503` propio de las vistas.

Las consultas con filtros se resuelven con los agregados que entrega la fuente. Las instantáneas generales se identifican únicamente por cohorte y vista, por lo que solo se consultan o actualizan en peticiones sin filtros. Los filtros de esta funcionalidad viven en cada solicitud y la bitácora registra `CONSULTA_AGREGADA` sin almacenar los valores de los filtros.

## RF-143 · Comparación

`GET /admin/cohortes/comparacion` acepta `ids` como lista de 2 a 5 identificadores UUID distintos separados por coma, `indicadores=PROGRESO,ADHERENCIA` y los límites de fecha opcionales de RF-135. Si se omiten los indicadores se piden ambos. La respuesta respeta el orden de selección. Los indicadores que no se solicitaron se representan con `null`.

- El repositorio obtiene los nombres de las cohortes seleccionadas, incluidas las históricas vigentes. M-5 recibe cada UUID con `incluirHistoricas` y el corte solicitado. La comparación consume la distribución y la adherencia de RF-78 sin recalcular sus valores.
- Si se obtuvo al menos un agregado, cada cohorte sin indicadores conserva su posición con valores `null`. Si ninguna tiene indicadores, se devuelve `422 COHORTES_SIN_INDICADORES`. Si RF-78 carece de soporte para un límite de fecha solicitado, se devuelve ese mismo estado funcional para evitar una comparación de acumulados etiquetada como histórica.
- Por decisión confirmada, con `n < 5` se conserva el tamaño publicado por la fuente y se suprimen ambos indicadores. Si la fuente reporta supresión o el tamaño no puede verificarse, tampoco se exponen las métricas. Una comparación de cohortes con agregados suprimidos devuelve `200` con la marca correspondiente.
- Los parámetros fuera de la consulta definida se ignoran. Si la comparación es válida, se mantienen las respuestas agregadas y se registra `INTENTO_EXTRACCION_RESTRINGIDA` como `DENEGADA` además de `CONSULTA_AGREGADA`. El aviso de seguridad contiene la identidad del actor y los UUID validados de las cohortes.

## Dependencias del contrato

RF-78 describe agregados de la cohorte activa y RF-143 requiere también cohortes históricas. M-5 debe implementar la consulta explícita por UUID histórico y por periodo. Los puertos actuales de M-5, M-6 y M-7 carecen de proveedores conectados. Las pruebas HTTP sustituyen esos puertos por dobles de prueba.

RF-143 menciona la tasa de abandono como ejemplo y RF-78 no la publica entre sus indicadores. Se aceptan `PROGRESO` y `ADHERENCIA` tal como establece el contrato REST facilitado. La selección de modalidad, unidad temporal y fechas de RF-135 depende de las capacidades que exponga cada fuente.
