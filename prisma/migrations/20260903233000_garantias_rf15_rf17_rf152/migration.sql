-- RF-15: el estado se calcula de forma lazy a partir de la ventana configurada.
-- Se reemplaza primero la definición no versionada que pudiera existir en la BD.
DROP VIEW IF EXISTS cronograma.v_contenidos_estado;
DROP FUNCTION IF EXISTS cronograma.fn_estado_contenido(timestamptz, timestamptz);

CREATE FUNCTION cronograma.fn_estado_contenido(
  timestamptz,
  timestamptz
)
RETURNS cronograma.estado_contenido_enum
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN CURRENT_TIMESTAMP < $1
      THEN 'PROGRAMADO'::cronograma.estado_contenido_enum
    WHEN CURRENT_TIMESTAMP >= $2
      THEN 'FINALIZADO'::cronograma.estado_contenido_enum
    ELSE 'ACTIVO'::cronograma.estado_contenido_enum
  END;
$$;

-- Solo los cronogramas activos y contenidos con una ventana completa pueden
-- producir eventos. El id_cronograma se obtiene de la unidad temporal porque
-- contenidos_cronograma ya no mantiene esa columna redundante.
CREATE OR REPLACE VIEW cronograma.v_contenidos_estado AS
SELECT
  contenido_cronograma.id_contenido_cronograma,
  contenido_cronograma.id_contenido,
  unidad.id_cronograma,
  contenido_cronograma.fecha_inicio_disponibilidad,
  contenido_cronograma.fecha_fin_disponibilidad,
  cronograma.fn_estado_contenido(
    contenido_cronograma.fecha_inicio_disponibilidad,
    contenido_cronograma.fecha_fin_disponibilidad
  ) AS estado_actual
FROM cronograma.contenidos_cronograma AS contenido_cronograma
INNER JOIN cronograma.unidades_temporales AS unidad
  ON unidad.id_unidad_temporal = contenido_cronograma.id_unidad_temporal
INNER JOIN cronograma.cronogramas AS cronograma
  ON cronograma.id_cronograma = unidad.id_cronograma
WHERE cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  AND contenido_cronograma.fecha_inicio_disponibilidad IS NOT NULL
  AND contenido_cronograma.fecha_fin_disponibilidad IS NOT NULL;

-- El payload debe ser un objeto JSON no vacío. La estructura versionada y la
-- ausencia de campos nulos también se validan en la entidad de dominio.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_evento_payload_no_vacio'
      AND conrelid = 'cronograma.eventos_contenido'::regclass
  ) THEN
    ALTER TABLE cronograma.eventos_contenido
      ADD CONSTRAINT ck_evento_payload_no_vacio CHECK (
        jsonb_typeof(payload) = 'object'
        AND payload <> '{}'::jsonb
      );
  END IF;
END $$;

-- Los eventos almacenados son inmutables. Las entregas al bus se registran en
-- una tabla separada para permitir reintentos sin modificar el payload.
CREATE OR REPLACE FUNCTION cronograma.fn_evento_contenido_inmutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Los eventos de contenido publicados son inmutables.'
    USING ERRCODE = '23514',
          CONSTRAINT = 'trg_evento_contenido_inmutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_evento_contenido_inmutable
  ON cronograma.eventos_contenido;

CREATE TRIGGER trg_evento_contenido_inmutable
BEFORE UPDATE ON cronograma.eventos_contenido
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_evento_contenido_inmutable();

-- Outbox local por módulo: el evento y sus entregas se crean en una misma
-- transacción. Un fallo del bus deja la entrega pendiente para el siguiente job.
CREATE TABLE IF NOT EXISTS cronograma.entregas_evento_contenido (
  id_evento bigint NOT NULL,
  id_modulo uuid NOT NULL,
  fecha_creacion timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  intentos_publicacion integer NOT NULL DEFAULT 0,
  fecha_ultimo_intento timestamptz(6),
  fecha_publicacion timestamptz(6),
  ultimo_error varchar(500),
  CONSTRAINT entregas_evento_contenido_pkey
    PRIMARY KEY (id_evento, id_modulo),
  CONSTRAINT fk_entrega_evento
    FOREIGN KEY (id_evento)
    REFERENCES cronograma.eventos_contenido(id_evento)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_entrega_modulo
    FOREIGN KEY (id_modulo)
    REFERENCES cronograma.modulos_sistema(id_modulo)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT ck_entrega_intentos_no_negativos
    CHECK (intentos_publicacion >= 0),
  CONSTRAINT ck_entrega_estado_coherente
    CHECK (
      (fecha_publicacion IS NULL)
      OR (fecha_publicacion IS NOT NULL AND ultimo_error IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_entregas_evento_pendientes
  ON cronograma.entregas_evento_contenido(fecha_creacion)
  WHERE fecha_publicacion IS NULL;

-- Catálogo requerido por RF-15. El UPSERT permite aplicar esta garantía tanto
-- si el seed de RF-154 ya se ejecutó como si esta migración llega después.
INSERT INTO cronograma.modulos_sistema (
  id_modulo,
  codigo_modulo,
  nombre_modulo,
  activo
)
VALUES
  ('00000000-0000-4000-8000-000000000003', 'CHAT', 'Chat', true),
  ('00000000-0000-4000-8000-000000000004', 'DIARIO', 'Diario', true),
  ('00000000-0000-4000-8000-000000000005', 'SEGUIM', 'Seguimiento', true),
  ('00000000-0000-4000-8000-000000000006', 'GAMIF', 'Gamificación', true),
  ('00000000-0000-4000-8000-000000000007', 'NOTIF', 'Notificaciones', true)
ON CONFLICT (codigo_modulo) DO UPDATE
SET nombre_modulo = EXCLUDED.nombre_modulo,
    activo = true;

-- Compatibilidad con eventos creados antes de introducir la salida
-- transaccional. Solo se recuperan destinos válidos que todavía existan.
INSERT INTO cronograma.entregas_evento_contenido (id_evento, id_modulo)
SELECT
  evento.id_evento,
  modulo.id_modulo
FROM cronograma.eventos_contenido AS evento
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(evento.payload -> 'modulos_destino') = 'array'
      THEN evento.payload -> 'modulos_destino'
    ELSE '[]'::jsonb
  END
) AS destino
INNER JOIN cronograma.modulos_sistema AS modulo
  ON modulo.id_modulo::text = destino ->> 'id_modulo'
ON CONFLICT (id_evento, id_modulo) DO NOTHING;

-- RF-17: segunda barrera para impedir que cualquier cliente asigne un
-- cronograma inactivo, incluso si omite el caso de uso del backend.
CREATE OR REPLACE FUNCTION cronograma.fn_cronograma_usuario_validar_activo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cronograma.cronogramas AS cronograma
    WHERE cronograma.id_cronograma = NEW.id_cronograma
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se puede asignar un cronograma que no esté activo.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_cronograma_usuario_validar_activo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cronograma_usuario_validar_activo
  ON cronograma.cronogramas_usuario;

CREATE TRIGGER trg_cronograma_usuario_validar_activo
BEFORE INSERT OR UPDATE OF id_cronograma
ON cronograma.cronogramas_usuario
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_cronograma_usuario_validar_activo();

-- RF-152: un contenido asociado a cualquier cronograma activo queda protegido
-- frente a UPDATE y DELETE. La relación se resuelve a través de la unidad.
CREATE OR REPLACE FUNCTION cronograma.fn_contenido_bloqueo_cronograma_activo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cronograma.contenidos_cronograma AS contenido_cronograma
    INNER JOIN cronograma.unidades_temporales AS unidad
      ON unidad.id_unidad_temporal = contenido_cronograma.id_unidad_temporal
    INNER JOIN cronograma.cronogramas AS cronograma
      ON cronograma.id_cronograma = unidad.id_cronograma
    WHERE contenido_cronograma.id_contenido = OLD.id_contenido
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se puede modificar un contenido asociado a un cronograma activo.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_contenido_bloqueo_cronograma_activo';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contenido_bloqueo_cronograma_activo
  ON cronograma.contenidos;

CREATE TRIGGER trg_contenido_bloqueo_cronograma_activo
BEFORE UPDATE OR DELETE ON cronograma.contenidos
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_contenido_bloqueo_cronograma_activo();

-- Si el cronograma está inactivo, RF-152 permite eliminar el contenido. La
-- asociación se elimina por cascada después de que el trigger anterior haya
-- comprobado que el contenido no pertenece a un cronograma activo.
ALTER TABLE cronograma.contenidos_cronograma
  DROP CONSTRAINT IF EXISTS fk_contenido_cronograma_contenido;

ALTER TABLE cronograma.contenidos_cronograma
  ADD CONSTRAINT fk_contenido_cronograma_contenido
  FOREIGN KEY (id_contenido)
  REFERENCES cronograma.contenidos(id_contenido)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;
