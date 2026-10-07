-- RF-23 compone RF-22 y RF-21 en una sola consulta y un único instante,
-- manteniendo toda la lógica temporal dentro de PostgreSQL.
CREATE OR REPLACE FUNCTION cronograma.fn_informacion_temporal_usuario(
  p_id_usuario uuid,
  p_fecha_consulta timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  ubicacion_id_usuario uuid,
  ubicacion_id_cronograma_usuario uuid,
  ubicacion_id_cronograma uuid,
  ubicacion_id_unidad_temporal uuid,
  ubicacion_nombre_unidad varchar(150),
  ubicacion_orden_unidad integer,
  fecha_calculo timestamptz,
  tiempo_efectivo_transcurrido_segundos double precision,
  cronograma_finalizado boolean,
  mensaje text,
  contenido_id_contenido uuid,
  contenido_id_contenido_cronograma uuid,
  contenido_nombre_contenido varchar(255),
  contenido_tipo_contenido cronograma.tipo_contenido_enum,
  contenido_id_unidad_temporal uuid,
  contenido_nombre_unidad varchar(150),
  contenido_orden_unidad integer,
  contenido_orden_contenido integer,
  contenido_fecha_inicio_disponibilidad timestamptz,
  contenido_fecha_fin_disponibilidad timestamptz,
  contenido_estado_disponibilidad cronograma.estado_contenido_enum
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
    INNER JOIN cronograma.cronogramas AS cronograma
      ON cronograma.id_cronograma = asignacion.id_cronograma
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
    WHERE asignacion.id_usuario = p_id_usuario
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf23_cronograma_activo_no_asignado',
      MESSAGE = 'El usuario no tiene un cronograma activo asignado.';
  END IF;

  RETURN QUERY
  SELECT
    ubicacion.id_usuario,
    ubicacion.id_cronograma_usuario,
    ubicacion.id_cronograma,
    ubicacion.id_unidad_temporal,
    ubicacion.nombre_unidad,
    ubicacion.orden_unidad,
    ubicacion.fecha_calculo,
    ubicacion.tiempo_efectivo_transcurrido_segundos,
    ubicacion.cronograma_finalizado,
    ubicacion.mensaje,
    contenido.id_contenido,
    contenido.id_contenido_cronograma,
    contenido.nombre_contenido,
    contenido.tipo_contenido,
    contenido.id_unidad_temporal,
    contenido.nombre_unidad,
    contenido.orden_unidad,
    contenido.orden_contenido,
    contenido.fecha_inicio_disponibilidad,
    contenido.fecha_fin_disponibilidad,
    contenido.estado_disponibilidad
  FROM cronograma.fn_ubicacion_temporal_usuario(
    p_id_usuario,
    v_fecha_consulta
  ) AS ubicacion
  LEFT JOIN LATERAL cronograma.fn_contenido_vigente_usuario(
    p_id_usuario,
    v_fecha_consulta
  ) AS contenido ON TRUE
  ORDER BY
    contenido.orden_unidad NULLS LAST,
    contenido.orden_contenido NULLS LAST,
    contenido.id_contenido;
END;
$$;

COMMENT ON FUNCTION cronograma.fn_informacion_temporal_usuario(
  uuid,
  timestamptz
)
IS 'RF-23: expone en una sola lectura la ubicación temporal y los contenidos vigentes de un usuario.';
