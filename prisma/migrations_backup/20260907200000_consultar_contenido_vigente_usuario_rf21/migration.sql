-- RF-21 delega en PostgreSQL la ubicación y disponibilidad temporal.
-- La función retorna cero filas cuando no existe contenido vigente.
CREATE OR REPLACE FUNCTION cronograma.fn_contenido_vigente_usuario(
  p_id_usuario uuid,
  p_fecha_consulta timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  id_contenido uuid,
  id_contenido_cronograma uuid,
  nombre_contenido varchar(255),
  tipo_contenido cronograma.tipo_contenido_enum,
  id_unidad_temporal uuid,
  nombre_unidad varchar(150),
  orden_unidad integer,
  orden_contenido integer,
  fecha_inicio_disponibilidad timestamptz,
  fecha_fin_disponibilidad timestamptz,
  estado_disponibilidad cronograma.estado_contenido_enum
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, cronograma
AS $$
DECLARE
  v_fecha_consulta timestamptz := COALESCE(
    p_fecha_consulta,
    CURRENT_TIMESTAMP
  );
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cronograma.cronogramas_usuario AS asignacion
    WHERE asignacion.id_usuario = p_id_usuario
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf21_cronograma_usuario_no_asignado',
      MESSAGE = 'El usuario no tiene un cronograma asignado.';
  END IF;

  RETURN QUERY
  WITH ubicacion AS (
    SELECT resultado.*
    FROM cronograma.fn_ubicacion_temporal_usuario(
      p_id_usuario,
      v_fecha_consulta
    ) AS resultado
  ),
  inicio_plantilla AS (
    SELECT MIN(unidad.fecha_inicio) AS fecha_inicio
    FROM cronograma.unidades_temporales AS unidad
    INNER JOIN ubicacion
      ON ubicacion.id_cronograma = unidad.id_cronograma
  ),
  instante_efectivo AS (
    SELECT
      ubicacion.*,
      (inicio_plantilla.fecha_inicio::timestamp AT TIME ZONE 'UTC')
        + (
          ubicacion.tiempo_efectivo_transcurrido_segundos
            * INTERVAL '1 second'
        ) AS fecha_efectiva_plantilla
    FROM ubicacion
    CROSS JOIN inicio_plantilla
  )
  SELECT
    contenido.id_contenido,
    programacion.id_contenido_cronograma,
    contenido.nombre_contenido,
    contenido.tipo_contenido,
    unidad.id_unidad_temporal,
    unidad.nombre_unidad,
    unidad.orden_unidad,
    programacion.orden_contenido,
    programacion.fecha_inicio_disponibilidad,
    programacion.fecha_fin_disponibilidad,
    'ACTIVO'::cronograma.estado_contenido_enum
  FROM instante_efectivo
  INNER JOIN cronograma.unidades_temporales AS unidad
    ON unidad.id_unidad_temporal = instante_efectivo.id_unidad_temporal
  INNER JOIN cronograma.contenidos_cronograma AS programacion
    ON programacion.id_unidad_temporal = unidad.id_unidad_temporal
  INNER JOIN cronograma.contenidos AS contenido
    ON contenido.id_contenido = programacion.id_contenido
  WHERE NOT instante_efectivo.cronograma_finalizado
    AND programacion.fecha_inicio_disponibilidad IS NOT NULL
    AND programacion.fecha_fin_disponibilidad IS NOT NULL
    AND instante_efectivo.fecha_efectiva_plantilla >=
      programacion.fecha_inicio_disponibilidad
    AND instante_efectivo.fecha_efectiva_plantilla <
      programacion.fecha_fin_disponibilidad
  ORDER BY
    unidad.orden_unidad,
    programacion.orden_contenido NULLS LAST,
    contenido.id_contenido;
END;
$$;

COMMENT ON FUNCTION cronograma.fn_contenido_vigente_usuario(uuid, timestamptz)
IS 'RF-21: retorna contenido vigente según ubicación, pausas y programación temporal del usuario.';
