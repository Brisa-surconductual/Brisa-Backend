-- RF-22 centraliza en PostgreSQL el cálculo de la ubicación temporal.
-- Tanto las unidades como las pausas se interpretan como intervalos
-- semiabiertos [inicio, fin), evitando duplicidad en límites adyacentes.
CREATE OR REPLACE FUNCTION cronograma.fn_ubicacion_temporal_usuario(
  p_id_usuario uuid,
  p_fecha_calculo timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  id_usuario uuid,
  id_cronograma_usuario uuid,
  id_cronograma uuid,
  id_unidad_temporal uuid,
  nombre_unidad varchar(150),
  orden_unidad integer,
  fecha_calculo timestamptz,
  tiempo_efectivo_transcurrido_segundos double precision,
  cronograma_finalizado boolean,
  mensaje text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, cronograma, usuario
AS $$
DECLARE
  v_id_cronograma_usuario uuid;
  v_id_cronograma uuid;
  v_fecha_inicio_usuario timestamptz;
  v_fecha_calculo timestamptz := COALESCE(p_fecha_calculo, CURRENT_TIMESTAMP);
  v_fecha_inicio_plantilla date;
  v_fecha_fin_plantilla date;
  v_tiempo_pausado interval := INTERVAL '0 seconds';
  v_tiempo_efectivo interval := INTERVAL '0 seconds';
  v_id_unidad_temporal uuid;
  v_nombre_unidad varchar(150);
  v_orden_unidad integer;
  v_cronograma_finalizado boolean := false;
BEGIN
  SELECT
    asignacion.id_cronograma_usuario,
    asignacion.id_cronograma,
    asignacion.fecha_inicio_usuario
  INTO
    v_id_cronograma_usuario,
    v_id_cronograma,
    v_fecha_inicio_usuario
  FROM cronograma.cronogramas_usuario AS asignacion
  WHERE asignacion.id_usuario = p_id_usuario;

  IF NOT FOUND OR v_fecha_inicio_usuario IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf22_fecha_inicio_requerida',
      MESSAGE = 'El usuario no tiene una fecha de inicio registrada en el programa.';
  END IF;

  SELECT
    MIN(unidad.fecha_inicio),
    MAX(unidad.fecha_fin)
  INTO
    v_fecha_inicio_plantilla,
    v_fecha_fin_plantilla
  FROM cronograma.unidades_temporales AS unidad
  WHERE unidad.id_cronograma = v_id_cronograma;

  IF v_fecha_inicio_plantilla IS NULL OR v_fecha_fin_plantilla IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf22_cronograma_sin_unidades',
      MESSAGE = 'El cronograma no cuenta con unidades temporales definidas para realizar el cálculo.';
  END IF;

  -- Antes del inicio todavía no existe una unidad vigente. El tiempo efectivo
  -- se mantiene en cero y el cronograma no se considera finalizado.
  IF v_fecha_calculo < v_fecha_inicio_usuario THEN
    RETURN QUERY
    SELECT
      p_id_usuario,
      v_id_cronograma_usuario,
      v_id_cronograma,
      NULL::uuid,
      NULL::varchar(150),
      NULL::integer,
      v_fecha_calculo,
      0::double precision,
      false,
      NULL::text;
    RETURN;
  END IF;

  -- Solo se descuenta la intersección de cada pausa no anulada con el tiempo
  -- ya transcurrido desde el inicio individual del programa.
  SELECT COALESCE(
    SUM(
      LEAST(pausa.fecha_fin_pausa, v_fecha_calculo)
        - GREATEST(pausa.fecha_inicio_pausa, v_fecha_inicio_usuario)
    ),
    INTERVAL '0 seconds'
  )
  INTO v_tiempo_pausado
  FROM cronograma.pausas_administrativas AS pausa
  WHERE pausa.id_cronograma_usuario = v_id_cronograma_usuario
    AND pausa.estado_pausa <> 'ANULADA'::cronograma.estado_pausa_enum
    AND pausa.fecha_inicio_pausa < v_fecha_calculo
    AND pausa.fecha_fin_pausa > v_fecha_inicio_usuario;

  v_tiempo_efectivo := GREATEST(
    v_fecha_calculo - v_fecha_inicio_usuario - v_tiempo_pausado,
    INTERVAL '0 seconds'
  );

  SELECT
    unidad.id_unidad_temporal,
    unidad.nombre_unidad,
    unidad.orden_unidad
  INTO
    v_id_unidad_temporal,
    v_nombre_unidad,
    v_orden_unidad
  FROM cronograma.unidades_temporales AS unidad
  WHERE unidad.id_cronograma = v_id_cronograma
    AND v_tiempo_efectivo >=
      ((unidad.fecha_inicio - v_fecha_inicio_plantilla) * INTERVAL '1 day')
    AND v_tiempo_efectivo <
      ((unidad.fecha_fin - v_fecha_inicio_plantilla) * INTERVAL '1 day')
  ORDER BY unidad.orden_unidad
  LIMIT 1;

  v_cronograma_finalizado := v_tiempo_efectivo >=
    ((v_fecha_fin_plantilla - v_fecha_inicio_plantilla) * INTERVAL '1 day');

  RETURN QUERY
  SELECT
    p_id_usuario,
    v_id_cronograma_usuario,
    v_id_cronograma,
    v_id_unidad_temporal,
    v_nombre_unidad,
    v_orden_unidad,
    v_fecha_calculo,
    EXTRACT(EPOCH FROM v_tiempo_efectivo)::double precision,
    v_cronograma_finalizado,
    CASE
      WHEN v_cronograma_finalizado
        THEN 'El usuario ha completado la totalidad del cronograma.'
      ELSE NULL
    END;
END;
$$;

COMMENT ON FUNCTION cronograma.fn_ubicacion_temporal_usuario(uuid, timestamptz)
IS 'RF-22: calcula la unidad vigente usando tiempo efectivo y pausas administrativas no anuladas.';
