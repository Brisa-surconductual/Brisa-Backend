-- La coherencia entre tipo y campos no es representable en schema.prisma.
-- Se conserva como migración SQL explícita para todas las instalaciones.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_recurso_coherente'
      AND conrelid = 'cronograma.recursos_contenido'::regclass
  ) THEN
    ALTER TABLE cronograma.recursos_contenido
      ADD CONSTRAINT ck_recurso_coherente CHECK (
        (
          tipo_recurso = 'TEXTO'
          AND texto_contenido IS NOT NULL
          AND btrim(texto_contenido) <> ''
          AND clave_almacenamiento IS NULL
          AND mime_type IS NULL
          AND tamano_bytes IS NULL
        )
        OR
        (
          tipo_recurso <> 'TEXTO'
          AND texto_contenido IS NULL
          AND clave_almacenamiento IS NOT NULL
          AND btrim(clave_almacenamiento) <> ''
          AND mime_type IS NOT NULL
          AND btrim(mime_type) <> ''
          AND tamano_bytes > 0
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION cronograma.fn_recurso_requiere_modulo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recurso_uuid uuid;
BEGIN
  IF TG_TABLE_NAME = 'recursos_contenido' THEN
    recurso_uuid := NEW.id_recurso;
  ELSIF TG_OP = 'DELETE' THEN
    recurso_uuid := OLD.id_recurso;
  ELSE
    recurso_uuid := OLD.id_recurso;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cronograma.recursos_contenido recurso
    WHERE recurso.id_recurso = recurso_uuid
  ) AND NOT EXISTS (
    SELECT 1
    FROM cronograma.recursos_modulos_destino destino
    WHERE destino.id_recurso = recurso_uuid
  ) THEN
    RAISE EXCEPTION 'El recurso debe tener al menos un módulo destino asignado.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_recurso_requiere_modulo';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recurso_requiere_modulo
  ON cronograma.recursos_contenido;

CREATE CONSTRAINT TRIGGER trg_recurso_requiere_modulo
AFTER INSERT OR UPDATE ON cronograma.recursos_contenido
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_recurso_requiere_modulo();

DROP TRIGGER IF EXISTS trg_recurso_requiere_modulo
  ON cronograma.recursos_modulos_destino;

CREATE CONSTRAINT TRIGGER trg_recurso_requiere_modulo
AFTER DELETE OR UPDATE ON cronograma.recursos_modulos_destino
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION cronograma.fn_recurso_requiere_modulo();
