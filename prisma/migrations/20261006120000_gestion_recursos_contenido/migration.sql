-- La clave de un objeto no puede quedar asociada a varios recursos: el outbox
-- puede eliminarla de S3 sólo cuando ya no exista una referencia.
CREATE UNIQUE INDEX IF NOT EXISTS uq_recurso_clave_almacenamiento
  ON cronograma.recursos_contenido (clave_almacenamiento)
  WHERE clave_almacenamiento IS NOT NULL;

CREATE TABLE IF NOT EXISTS cronograma.limpieza_objetos_recurso (
  id_limpieza BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_contenido UUID NOT NULL,
  clave_almacenamiento TEXT NOT NULL UNIQUE,
  estado VARCHAR(16) NOT NULL DEFAULT 'PENDIENTE',
  intentos INTEGER NOT NULL DEFAULT 0,
  -- Espera la expiración máxima de URLs PUT emitidas antes de borrar el objeto.
  disponible_desde TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '65 minutes'),
  reclamado_en TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_completado TIMESTAMPTZ,
  ultimo_error TEXT,
  CONSTRAINT ck_limpieza_objeto_estado CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO')),
  CONSTRAINT ck_limpieza_objeto_intentos CHECK (intentos >= 0)
);

CREATE INDEX IF NOT EXISTS ix_limpieza_objetos_pendientes
  ON cronograma.limpieza_objetos_recurso (disponible_desde, id_limpieza)
  WHERE estado <> 'COMPLETADO';

CREATE OR REPLACE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_contenido UUID;
  v_cambia_clave BOOLEAN := false;
BEGIN
  IF TG_TABLE_NAME = 'recursos_contenido' THEN
    IF TG_OP = 'INSERT' THEN
      v_cambia_clave := true;
    ELSIF TG_OP = 'UPDATE' THEN
      v_cambia_clave := NEW.clave_almacenamiento IS DISTINCT FROM OLD.clave_almacenamiento;
    END IF;
    IF v_cambia_clave THEN
      IF NEW.clave_almacenamiento IS NOT NULL THEN
          IF EXISTS (SELECT 1 FROM cronograma.limpieza_objetos_recurso
                     WHERE clave_almacenamiento = NEW.clave_almacenamiento) THEN
            RAISE EXCEPTION 'La clave de almacenamiento ya fue retirada.'
              USING ERRCODE = '23514', CONSTRAINT = 'ck_recurso_clave_retirada';
          END IF;
      END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN
      v_id_contenido := OLD.id_contenido;
    ELSE
      v_id_contenido := NEW.id_contenido;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      SELECT id_contenido INTO v_id_contenido
      FROM cronograma.recursos_contenido WHERE id_recurso = OLD.id_recurso;
    ELSE
      SELECT id_contenido INTO v_id_contenido
      FROM cronograma.recursos_contenido WHERE id_recurso = NEW.id_recurso;
    END IF;
  END IF;

  IF v_id_contenido IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Serializa edición de recursos contra asociación/activación.
  PERFORM 1 FROM cronograma.contenidos
  WHERE id_contenido = v_id_contenido FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM cronograma.contenidos_cronograma cc
    JOIN cronograma.unidades_temporales ut ON ut.id_unidad_temporal = cc.id_unidad_temporal
    JOIN cronograma.cronogramas c ON c.id_cronograma = ut.id_cronograma
    WHERE cc.id_contenido = v_id_contenido
      AND c.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se pueden modificar recursos asociados a un cronograma activo.'
      USING ERRCODE = '23514', CONSTRAINT = 'trg_recurso_bloqueo_cronograma_activo';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_recurso_bloqueo_cronograma_activo ON cronograma.recursos_contenido;
CREATE TRIGGER trg_recurso_bloqueo_cronograma_activo
BEFORE INSERT OR UPDATE OR DELETE ON cronograma.recursos_contenido
FOR EACH ROW EXECUTE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo();

-- La cola se inserta en la misma transacción, incluidas eliminaciones por cascada.
CREATE OR REPLACE FUNCTION cronograma.fn_encolar_limpieza_objeto_recurso()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.clave_almacenamiento IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO cronograma.limpieza_objetos_recurso (id_contenido, clave_almacenamiento)
      VALUES (OLD.id_contenido, OLD.clave_almacenamiento)
      ON CONFLICT (clave_almacenamiento) DO NOTHING;
    ELSIF OLD.clave_almacenamiento IS DISTINCT FROM NEW.clave_almacenamiento THEN
      INSERT INTO cronograma.limpieza_objetos_recurso (id_contenido, clave_almacenamiento)
      VALUES (OLD.id_contenido, OLD.clave_almacenamiento)
      ON CONFLICT (clave_almacenamiento) DO NOTHING;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_encolar_limpieza_objeto_recurso ON cronograma.recursos_contenido;
CREATE TRIGGER trg_encolar_limpieza_objeto_recurso
AFTER DELETE OR UPDATE OF clave_almacenamiento ON cronograma.recursos_contenido
FOR EACH ROW EXECUTE FUNCTION cronograma.fn_encolar_limpieza_objeto_recurso();

DROP TRIGGER IF EXISTS trg_recurso_modulo_bloqueo_cronograma_activo ON cronograma.recursos_modulos_destino;
CREATE TRIGGER trg_recurso_modulo_bloqueo_cronograma_activo
BEFORE INSERT OR UPDATE OR DELETE ON cronograma.recursos_modulos_destino
FOR EACH ROW EXECUTE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo();

-- Al activar un cronograma se bloquean primero, en orden determinista, sus
-- contenidos; una edición concurrente de recursos queda serializada.
CREATE OR REPLACE FUNCTION cronograma.fn_bloquear_contenidos_al_activar_cronograma()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
     AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    PERFORM 1
    FROM cronograma.contenidos c
    JOIN cronograma.contenidos_cronograma cc ON cc.id_contenido = c.id_contenido
    JOIN cronograma.unidades_temporales ut ON ut.id_unidad_temporal = cc.id_unidad_temporal
    WHERE ut.id_cronograma = NEW.id_cronograma
    ORDER BY c.id_contenido
    FOR UPDATE OF c;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_contenidos_al_activar_cronograma ON cronograma.cronogramas;
CREATE TRIGGER trg_bloquear_contenidos_al_activar_cronograma
BEFORE UPDATE OF estado ON cronograma.cronogramas
FOR EACH ROW EXECUTE FUNCTION cronograma.fn_bloquear_contenidos_al_activar_cronograma();

-- Una nueva asociación también espera una edición que ya bloquee el contenido.
CREATE OR REPLACE FUNCTION cronograma.fn_bloquear_contenido_al_asociar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_contenido UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  v_id_contenido := NEW.id_contenido;
  -- Mismo orden de bloqueos que la activación: cronograma y luego contenido.
  PERFORM 1 FROM cronograma.cronogramas c
  JOIN cronograma.unidades_temporales ut ON ut.id_cronograma = c.id_cronograma
  WHERE ut.id_unidad_temporal = NEW.id_unidad_temporal FOR UPDATE OF c;
  PERFORM 1 FROM cronograma.contenidos
  WHERE id_contenido = v_id_contenido FOR UPDATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_contenido_al_asociar ON cronograma.contenidos_cronograma;
CREATE TRIGGER trg_bloquear_contenido_al_asociar
BEFORE INSERT OR UPDATE OF id_contenido, id_unidad_temporal ON cronograma.contenidos_cronograma
FOR EACH ROW EXECUTE FUNCTION cronograma.fn_bloquear_contenido_al_asociar();
