-- RF-22B requiere comparar UUID mediante GiST para excluir intervalos
-- solapados por asignación de cronograma.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_pausa_fechas'
      AND conrelid = 'cronograma.pausas_administrativas'::regclass
  ) THEN
    ALTER TABLE cronograma.pausas_administrativas
      ADD CONSTRAINT ck_pausa_fechas
      CHECK (fecha_fin_pausa >= fecha_inicio_pausa);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_pausa_motivo_no_vacio'
      AND conrelid = 'cronograma.pausas_administrativas'::regclass
  ) THEN
    ALTER TABLE cronograma.pausas_administrativas
      ADD CONSTRAINT ck_pausa_motivo_no_vacio
      CHECK (btrim(motivo_pausa) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ex_pausa_sin_solape'
      AND conrelid = 'cronograma.pausas_administrativas'::regclass
  ) THEN
    ALTER TABLE cronograma.pausas_administrativas
      ADD CONSTRAINT ex_pausa_sin_solape
      EXCLUDE USING gist (
        id_cronograma_usuario WITH =,
        tstzrange(fecha_inicio_pausa, fecha_fin_pausa, '[)') WITH &&
      )
      WHERE (estado_pausa <> 'ANULADA'::cronograma.estado_pausa_enum);
  END IF;
END $$;

-- El rango individual comienza en fecha_inicio_usuario y conserva la duración
-- configurada entre la primera y la última unidad temporal del cronograma.
CREATE OR REPLACE FUNCTION cronograma.fn_pausa_validar_rango()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_inicio_cronograma timestamptz;
  fecha_fin_cronograma timestamptz;
BEGIN
  SELECT
    asignacion.fecha_inicio_usuario,
    asignacion.fecha_inicio_usuario
      + ((MAX(unidad.fecha_fin) - MIN(unidad.fecha_inicio)) * INTERVAL '1 day')
  INTO fecha_inicio_cronograma, fecha_fin_cronograma
  FROM cronograma.cronogramas_usuario AS asignacion
  INNER JOIN usuario.usuarios AS estudiante
    ON estudiante.id_usuario = asignacion.id_usuario
    AND estudiante.rol = 'ESTUDIANTE'::usuario.rol_enum
  INNER JOIN cronograma.cronogramas AS cronograma
    ON cronograma.id_cronograma = asignacion.id_cronograma
  INNER JOIN cronograma.unidades_temporales AS unidad
    ON unidad.id_cronograma = cronograma.id_cronograma
  WHERE asignacion.id_cronograma_usuario = NEW.id_cronograma_usuario
    AND asignacion.id_usuario = NEW.id_usuario
    AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  GROUP BY asignacion.fecha_inicio_usuario;

  IF fecha_inicio_cronograma IS NULL OR fecha_fin_cronograma IS NULL THEN
    RAISE EXCEPTION 'El usuario seleccionado no tiene un cronograma activo asignado.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_pausa_validar_rango';
  END IF;

  IF NEW.fecha_inicio_pausa < fecha_inicio_cronograma
    OR NEW.fecha_inicio_pausa > fecha_fin_cronograma THEN
    RAISE EXCEPTION 'La fecha de inicio de la pausa debe encontrarse dentro del rango del cronograma activo del usuario.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_pausa_validar_rango';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pausa_validar_rango
  ON cronograma.pausas_administrativas;

CREATE TRIGGER trg_pausa_validar_rango
BEFORE INSERT OR UPDATE OF
  id_usuario,
  id_cronograma_usuario,
  fecha_inicio_pausa
ON cronograma.pausas_administrativas
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_pausa_validar_rango();
