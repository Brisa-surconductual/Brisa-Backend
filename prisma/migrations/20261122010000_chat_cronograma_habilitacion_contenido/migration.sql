-- Migración: chat_cronograma_habilitacion_contenido
-- Fecha: 2026-11-22
-- Descripción: RF-24 / RF-22 / RF-11 · ritmo de la terapia según el cronograma.
--   Indica si un contenido del cronograma ya está habilitado para un usuario:
--   su `fecha_inicio_disponibilidad` es anterior o igual al instante efectivo
--   del usuario en la plantilla (mismo cálculo de fn_contenido_vigente_usuario,
--   que descuenta pausas). Solo se bloquea por inicio, nunca por fin: un
--   contenido ya iniciado sigue habilitado aunque haya finalizado, para que un
--   usuario atrasado pueda ponerse al día sin adelantarse a su unidad actual.
--   Contrato: docs/CONTRATO_RF24_RITMO_CRONOGRAMA.md

BEGIN;

CREATE OR REPLACE FUNCTION cronograma.fn_habilitacion_contenido_usuario(
  p_id_usuario uuid,
  p_id_contenido_cronograma uuid,
  p_fecha_consulta timestamp with time zone DEFAULT CURRENT_TIMESTAMP
)
 RETURNS TABLE(habilitado boolean, fecha_habilitacion timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'cronograma'
AS $function$
DECLARE
  v_fecha_consulta timestamptz := COALESCE(p_fecha_consulta, CURRENT_TIMESTAMP);
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
      ubicacion.id_cronograma,
      ubicacion.cronograma_finalizado,
      (inicio_plantilla.fecha_inicio::timestamp AT TIME ZONE 'UTC')
        + (
          ubicacion.tiempo_efectivo_transcurrido_segundos
            * INTERVAL '1 second'
        ) AS fecha_efectiva_plantilla
    FROM ubicacion
    CROSS JOIN inicio_plantilla
  ),
  programacion AS (
    SELECT contenido_cronograma.fecha_inicio_disponibilidad
    FROM cronograma.contenidos_cronograma AS contenido_cronograma
    INNER JOIN cronograma.unidades_temporales AS unidad
      ON unidad.id_unidad_temporal = contenido_cronograma.id_unidad_temporal
    INNER JOIN instante_efectivo
      ON instante_efectivo.id_cronograma = unidad.id_cronograma
    WHERE contenido_cronograma.id_contenido_cronograma = p_id_contenido_cronograma
  )
  SELECT
    -- Sin programación en el cronograma del usuario (o sin fecha de inicio)
    -- no hay regla temporal que aplicar: el nodo no se bloquea.
    CASE
      WHEN instante_efectivo.cronograma_finalizado THEN true
      WHEN programacion.fecha_inicio_disponibilidad IS NULL THEN true
      ELSE instante_efectivo.fecha_efectiva_plantilla
             >= programacion.fecha_inicio_disponibilidad
    END AS habilitado,
    -- Fecha real aproximada: ahora + lo que le falta al usuario en la plantilla.
    CASE
      WHEN NOT instante_efectivo.cronograma_finalizado
        AND programacion.fecha_inicio_disponibilidad IS NOT NULL
        AND instante_efectivo.fecha_efectiva_plantilla
              < programacion.fecha_inicio_disponibilidad
      THEN v_fecha_consulta
             + (programacion.fecha_inicio_disponibilidad
                - instante_efectivo.fecha_efectiva_plantilla)
    END AS fecha_habilitacion
  FROM instante_efectivo
  LEFT JOIN programacion ON true;
END;
$function$;

COMMENT ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) IS
  'RF-24/RF-22: si un contenido del cronograma ya está habilitado para el usuario (solo bloquea por inicio).';

-- Solo la usa el backend: se retira a los roles de la API de Supabase y se
-- concede al rol de la aplicación, como las demás funciones del cronograma.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brisa_rw') THEN
    GRANT EXECUTE ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) TO brisa_rw;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) FROM authenticated;
  END IF;
END
$$;

COMMIT;
