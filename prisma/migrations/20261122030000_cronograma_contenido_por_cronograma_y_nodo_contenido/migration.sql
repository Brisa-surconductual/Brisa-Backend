-- Migración: cronograma_contenido_por_cronograma_y_nodo_contenido
-- Fecha: 2026-11-22
-- Descripción: un flujo conversacional para varios cronogramas (M03 × M04).
--   1. M04: un contenido se programa a lo sumo una vez POR cronograma (antes:
--      una vez en todo el sistema). `contenidos_cronograma.id_cronograma` se
--      deriva de la unidad temporal mediante trigger.
--   2. Chat: el nodo se liga al contenido (`nodos.id_contenido`), no a una
--      programación concreta. `id_contenido_cronograma` queda obsoleto.
--   3. La habilitación por cronograma busca la programación del contenido en
--      el cronograma asignado al usuario.
--   Contrato: docs/CONTRATO_RF24_RITMO_CRONOGRAMA.md

BEGIN;

-- ── 1. M04: contenido único por cronograma ──────────────────────────────────

ALTER TABLE cronograma.contenidos_cronograma
  ADD COLUMN IF NOT EXISTS id_cronograma uuid;

UPDATE cronograma.contenidos_cronograma AS programacion
SET id_cronograma = unidad.id_cronograma
FROM cronograma.unidades_temporales AS unidad
WHERE unidad.id_unidad_temporal = programacion.id_unidad_temporal
  AND programacion.id_cronograma IS DISTINCT FROM unidad.id_cronograma;

CREATE OR REPLACE FUNCTION cronograma.fn_contenido_cronograma_asignar_cronograma()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'cronograma'
AS $function$
BEGIN
  SELECT unidad.id_cronograma
    INTO NEW.id_cronograma
  FROM cronograma.unidades_temporales AS unidad
  WHERE unidad.id_unidad_temporal = NEW.id_unidad_temporal;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_contenido_cronograma_asignar_cronograma
  ON cronograma.contenidos_cronograma;
CREATE TRIGGER trg_contenido_cronograma_asignar_cronograma
  BEFORE INSERT OR UPDATE OF id_unidad_temporal, id_cronograma
  ON cronograma.contenidos_cronograma
  FOR EACH ROW
  EXECUTE FUNCTION cronograma.fn_contenido_cronograma_asignar_cronograma();

ALTER TABLE cronograma.contenidos_cronograma
  ALTER COLUMN id_cronograma SET NOT NULL;

ALTER TABLE cronograma.contenidos_cronograma
  DROP CONSTRAINT IF EXISTS fk_contenido_cronograma_cronograma;
ALTER TABLE cronograma.contenidos_cronograma
  ADD CONSTRAINT fk_contenido_cronograma_cronograma
  FOREIGN KEY (id_cronograma) REFERENCES cronograma.cronogramas (id_cronograma)
  ON DELETE CASCADE;

DROP INDEX IF EXISTS cronograma.uq_contenido_unico_en_cronograma;
CREATE UNIQUE INDEX IF NOT EXISTS uq_contenido_unico_por_cronograma
  ON cronograma.contenidos_cronograma (id_cronograma, id_contenido);

COMMENT ON COLUMN cronograma.contenidos_cronograma.id_cronograma IS
  'Cronograma de la unidad (lo asigna un trigger). Un contenido se programa a lo sumo una vez por cronograma.';

-- ── 2. Chat: el nodo se liga al contenido ───────────────────────────────────

ALTER TABLE chat.nodos
  ADD COLUMN IF NOT EXISTS id_contenido uuid;

ALTER TABLE chat.nodos DROP CONSTRAINT IF EXISTS fk_nodo_contenido;
ALTER TABLE chat.nodos
  ADD CONSTRAINT fk_nodo_contenido
  FOREIGN KEY (id_contenido) REFERENCES cronograma.contenidos (id_contenido)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nodos_contenido ON chat.nodos (id_contenido);

UPDATE chat.nodos AS nodo
SET id_contenido = programacion.id_contenido
FROM cronograma.contenidos_cronograma AS programacion
WHERE programacion.id_contenido_cronograma = nodo.id_contenido_cronograma
  AND nodo.id_contenido IS NULL;

COMMENT ON COLUMN chat.nodos.id_contenido IS
  'RF-25/RF-24: contenido del nodo. Cada estudiante lo recorre según su programación en su propio cronograma.';
COMMENT ON COLUMN chat.nodos.id_contenido_cronograma IS
  'OBSOLETO: reemplazado por id_contenido. Se eliminará en una migración posterior.';

-- ── 3. Habilitación por contenido en el cronograma del usuario ─────────────

DROP FUNCTION IF EXISTS cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz);

CREATE FUNCTION cronograma.fn_habilitacion_contenido_usuario(
  p_id_usuario uuid,
  p_id_contenido uuid,
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
  -- La programación del contenido en el cronograma de ESTE usuario.
  programacion AS (
    SELECT contenido_cronograma.fecha_inicio_disponibilidad
    FROM cronograma.contenidos_cronograma AS contenido_cronograma
    INNER JOIN instante_efectivo
      ON instante_efectivo.id_cronograma = contenido_cronograma.id_cronograma
    WHERE contenido_cronograma.id_contenido = p_id_contenido
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
  'RF-24/RF-22: si un contenido ya está habilitado para el usuario según su propio cronograma (solo bloquea por inicio).';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brisa_rw') THEN
    GRANT EXECUTE ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) TO brisa_rw;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) FROM anon;
    REVOKE ALL ON FUNCTION cronograma.fn_contenido_cronograma_asignar_cronograma() FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION cronograma.fn_habilitacion_contenido_usuario(uuid, uuid, timestamptz) FROM authenticated;
    REVOKE ALL ON FUNCTION cronograma.fn_contenido_cronograma_asignar_cronograma() FROM authenticated;
  END IF;
END
$$;

COMMIT;
