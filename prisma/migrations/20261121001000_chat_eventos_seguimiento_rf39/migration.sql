BEGIN;

CREATE TYPE chat.origen_evento_seguimiento_enum AS ENUM ('CIERRE_SESION', 'SINCRONIZACION_OFFLINE');
CREATE TYPE chat.estado_evento_seguimiento_enum AS ENUM ('ENCOLADO', 'ENTREGADO', 'ERROR_REINTENTO');

CREATE TABLE chat.eventos_seguimiento (
    id_evento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sesion uuid NOT NULL REFERENCES chat.sesiones (id_sesion) ON DELETE CASCADE,
    id_usuario uuid NOT NULL,
    modalidad chat.modalidad_enum NOT NULL,
    tipo_dependencia chat.tipo_dependencia_enum,
    tipo_craving chat.tipo_craving_enum,
    origen_evento chat.origen_evento_seguimiento_enum NOT NULL,
    estado chat.estado_evento_seguimiento_enum NOT NULL DEFAULT 'ENCOLADO',
    timestamp timestamptz NOT NULL,
    proximo_envio_en timestamptz NOT NULL DEFAULT now(),
    entregado_en timestamptz,
    CONSTRAINT uq_eventos_seguimiento_sesion_origen UNIQUE (id_sesion, origen_evento),
    CONSTRAINT ck_eventos_seguimiento_perfil CHECK (
        (modalidad = 'GRUPAL' AND tipo_dependencia IS NULL AND tipo_craving IS NULL)
        OR (modalidad = 'PERSONALIZADA' AND tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
    ),
    CONSTRAINT ck_eventos_seguimiento_entrega CHECK (
        (estado = 'ENTREGADO') = (entregado_en IS NOT NULL)
    )
);

CREATE INDEX ix_eventos_seguimiento_pendientes
    ON chat.eventos_seguimiento (proximo_envio_en, id_evento)
    WHERE estado <> 'ENTREGADO';

CREATE FUNCTION chat.fn_registrar_evento_sesion_finalizada() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    INSERT INTO chat.eventos_seguimiento (
        id_sesion, id_usuario, modalidad, tipo_dependencia, tipo_craving, origen_evento, timestamp
    )
    SELECT s.id_sesion, s.id_usuario, s.modalidad_activa,
        CASE WHEN s.modalidad_activa = 'PERSONALIZADA' THEN s.tipo_dependencia END,
        CASE WHEN s.modalidad_activa = 'PERSONALIZADA' THEN s.tipo_craving END,
        'CIERRE_SESION', COALESCE(NEW.fecha_completada, statement_timestamp())
    FROM chat.sesiones s
    WHERE s.id_sesion = NEW.id_sesion AND EXISTS (
        SELECT 1 FROM chat.interacciones i
        JOIN chat.respuestas r ON r.id_interaccion = i.id_interaccion
        WHERE i.id_sesion = s.id_sesion AND r.es_valida
    )
    ON CONFLICT (id_sesion, origen_evento) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evento_sesion_finalizada
    AFTER UPDATE OF estado_actual ON chat.estado_sesiones
    FOR EACH ROW
    WHEN (NEW.estado_actual = 'COMPLETADA' AND OLD.estado_actual IS DISTINCT FROM NEW.estado_actual)
    EXECUTE FUNCTION chat.fn_registrar_evento_sesion_finalizada();

REVOKE ALL ON chat.eventos_seguimiento FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION chat.fn_registrar_evento_sesion_finalizada() FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON chat.eventos_seguimiento FROM anon;
        REVOKE EXECUTE ON FUNCTION chat.fn_registrar_evento_sesion_finalizada() FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON chat.eventos_seguimiento FROM authenticated;
        REVOKE EXECUTE ON FUNCTION chat.fn_registrar_evento_sesion_finalizada() FROM authenticated;
    END IF;
END;
$$;

COMMIT;
