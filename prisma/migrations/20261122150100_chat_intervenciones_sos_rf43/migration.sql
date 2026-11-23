-- RF-43 · Protocolo SOS "Tengo ganas de vapear" (2/2).
-- Contrato: docs/CONTRATO_RF43_SOS_CRAVING.md
--
-- * chat.recursos_apoyo: catálogo de líneas de ayuda (seed).
-- * chat.intervenciones_sos: una intervención por activación; el inicio, el
--   límite de 60 s y la duración salen del reloj de PostgreSQL.
-- * chat.fn_cerrar_intervencion_sos: único punto de cierre; escribe el evento
--   CHAT_SOS_ACTIVADO en el outbox de RF-39 en la misma transacción.
-- * Flujo SOS: un único publicado, como el grupal.

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
CREATE TYPE chat.estado_intervencion_sos_enum AS ENUM ('EN_CURSO', 'COMPLETA', 'INCOMPLETA', 'EXPIRADA');
CREATE TYPE chat.estado_sesion_anterior_sos_enum AS ENUM ('ACTIVA', 'PAUSADA', 'NINGUNA');
CREATE TYPE chat.tipo_recurso_apoyo_enum AS ENUM ('LINEA_CRISIS', 'CONTACTO_INSTITUCIONAL');
CREATE TYPE chat.tipo_evento_seguimiento_enum AS ENUM ('CHAT_SESION_FINALIZADA', 'CHAT_SOS_ACTIVADO');

-- ---------------------------------------------------------------------
-- 2. Recursos de apoyo
-- ---------------------------------------------------------------------
CREATE TABLE chat.recursos_apoyo (
    id_recurso_apoyo uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre varchar(120) NOT NULL,
    tipo chat.tipo_recurso_apoyo_enum NOT NULL,
    telefono varchar(30) NOT NULL,
    descripcion varchar(500),
    orden integer NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_recursos_apoyo_nombre UNIQUE (nombre),
    CONSTRAINT ck_recursos_apoyo_orden CHECK (orden > 0)
);

CREATE INDEX ix_recursos_apoyo_activos ON chat.recursos_apoyo (orden, nombre) WHERE activo;

-- Líneas indicadas por RF-43. El contacto institucional de la USCO queda
-- inactivo hasta que el equipo confirme el número.
INSERT INTO chat.recursos_apoyo (nombre, tipo, telefono, descripcion, orden, activo) VALUES
    ('Línea 106', 'LINEA_CRISIS', '106', 'Línea de escucha y apoyo emocional.', 1, true),
    ('Línea 123', 'LINEA_CRISIS', '123', 'Línea única de emergencias.', 2, true),
    ('Línea 155', 'LINEA_CRISIS', '155', 'Línea de orientación a mujeres víctimas de violencias.', 3, true),
    ('Bienestar Universitario USCO', 'CONTACTO_INSTITUCIONAL', 'POR_CONFIRMAR',
     'Contacto institucional de la Universidad Surcolombiana. Pendiente de confirmar el número.', 4, false);

-- ---------------------------------------------------------------------
-- 3. Intervenciones SOS
-- ---------------------------------------------------------------------
CREATE TABLE chat.intervenciones_sos (
    id_intervencion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario uuid NOT NULL REFERENCES usuario.usuarios (id_usuario) ON DELETE CASCADE,
    id_sesion_sos uuid NOT NULL REFERENCES chat.sesiones (id_sesion) ON DELETE CASCADE,
    id_sesion_pausada uuid REFERENCES chat.sesiones (id_sesion) ON DELETE SET NULL,
    estado_sesion_anterior chat.estado_sesion_anterior_sos_enum NOT NULL,
    nivel_craving smallint NOT NULL DEFAULT 5,
    tipo_craving chat.tipo_craving_enum,
    estado chat.estado_intervencion_sos_enum NOT NULL DEFAULT 'EN_CURSO',
    -- Ampliación B: lo que el estudiante hacía al oprimir el botón (opaco).
    contexto_origen jsonb,
    -- Ambos DEFAULT se evalúan con el mismo statement_timestamp().
    fecha_activacion timestamptz NOT NULL DEFAULT statement_timestamp(),
    fecha_limite timestamptz NOT NULL DEFAULT statement_timestamp() + interval '60 seconds',
    fecha_cierre timestamptz,
    duracion_segundos integer GENERATED ALWAYS AS (
        floor(extract(epoch FROM (fecha_cierre - fecha_activacion)))::integer
    ) STORED,
    CONSTRAINT uq_intervenciones_sos_sesion UNIQUE (id_sesion_sos),
    CONSTRAINT ck_intervenciones_sos_nivel CHECK (nivel_craving = 5),
    CONSTRAINT ck_intervenciones_sos_limite CHECK (fecha_limite = fecha_activacion + interval '60 seconds'),
    CONSTRAINT ck_intervenciones_sos_cierre CHECK ((estado = 'EN_CURSO') = (fecha_cierre IS NULL)),
    CONSTRAINT ck_intervenciones_sos_duracion CHECK (
        fecha_cierre IS NULL OR fecha_cierre BETWEEN fecha_activacion AND fecha_limite
    ),
    CONSTRAINT ck_intervenciones_sos_sesiones CHECK (id_sesion_pausada IS DISTINCT FROM id_sesion_sos),
    CONSTRAINT ck_intervenciones_sos_contexto CHECK (
        contexto_origen IS NULL OR jsonb_typeof(contexto_origen) = 'object'
    )
);

-- Una sola intervención en curso por estudiante.
CREATE UNIQUE INDEX uq_intervenciones_sos_en_curso
    ON chat.intervenciones_sos (id_usuario) WHERE estado = 'EN_CURSO';
-- Cron de expiración.
CREATE INDEX ix_intervenciones_sos_vencimiento
    ON chat.intervenciones_sos (fecha_limite) WHERE estado = 'EN_CURSO';
-- Cron de purga del contexto (Ley 1581).
CREATE INDEX ix_intervenciones_sos_contexto
    ON chat.intervenciones_sos (fecha_cierre) WHERE contexto_origen IS NOT NULL;
CREATE INDEX ix_intervenciones_sos_usuario
    ON chat.intervenciones_sos (id_usuario, fecha_activacion DESC);

-- ---------------------------------------------------------------------
-- 4. Outbox de RF-39 multi-tipo
-- ---------------------------------------------------------------------
ALTER TABLE chat.eventos_seguimiento
    ADD COLUMN tipo_evento chat.tipo_evento_seguimiento_enum NOT NULL DEFAULT 'CHAT_SESION_FINALIZADA',
    ADD COLUMN id_intervencion_sos uuid REFERENCES chat.intervenciones_sos (id_intervencion) ON DELETE CASCADE;

ALTER TABLE chat.eventos_seguimiento DROP CONSTRAINT ck_eventos_seguimiento_perfil;
ALTER TABLE chat.eventos_seguimiento ADD CONSTRAINT ck_eventos_seguimiento_perfil CHECK (
    (modalidad = 'GRUPAL' AND tipo_dependencia IS NULL AND tipo_craving IS NULL)
    OR (modalidad = 'PERSONALIZADA' AND tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
    -- SOS: tipo_craving sale del perfil vigente y puede faltar (GRUPAL o sin perfil).
    OR (modalidad = 'SOS' AND tipo_dependencia IS NULL)
);
ALTER TABLE chat.eventos_seguimiento ADD CONSTRAINT ck_eventos_seguimiento_tipo CHECK (
    (tipo_evento = 'CHAT_SOS_ACTIVADO') = (origen_evento = 'SOS')
    AND (tipo_evento = 'CHAT_SOS_ACTIVADO') = (modalidad = 'SOS')
    AND (tipo_evento = 'CHAT_SOS_ACTIVADO') = (id_intervencion_sos IS NOT NULL)
);

-- Una sesión SOS emite CHAT_SOS_ACTIVADO, no CHAT_SESION_FINALIZADA.
CREATE OR REPLACE FUNCTION chat.fn_registrar_evento_sesion_finalizada() RETURNS trigger
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
    WHERE s.id_sesion = NEW.id_sesion
      AND s.modalidad_activa <> 'SOS'
      AND EXISTS (
        SELECT 1 FROM chat.interacciones i
        JOIN chat.respuestas r ON r.id_interaccion = i.id_interaccion
        WHERE i.id_sesion = s.id_sesion AND r.es_valida
    )
    ON CONFLICT (id_sesion, origen_evento) DO NOTHING;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. Cierre de la intervención (reloj del servidor)
-- ---------------------------------------------------------------------
-- p_estado: COMPLETA, INCOMPLETA o EXPIRADA.
-- * Si el reloj ya superó fecha_limite, el estado es EXPIRADA y la duración
--   se topa en 60 s.
-- * COMPLETA exige que la sesión SOS haya llegado a su nodo final; si no,
--   se registra INCOMPLETA.
-- Devuelve false si la intervención no existe o ya estaba cerrada.
CREATE FUNCTION chat.fn_cerrar_intervencion_sos(
    p_id_intervencion uuid,
    p_estado chat.estado_intervencion_sos_enum
) RETURNS boolean
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_ahora timestamptz := statement_timestamp();
    v chat.intervenciones_sos%ROWTYPE;
    v_estado chat.estado_intervencion_sos_enum := p_estado;
BEGIN
    IF p_estado IS NULL OR p_estado = 'EN_CURSO' THEN
        RAISE EXCEPTION 'Estado de cierre SOS no válido: %', p_estado;
    END IF;

    SELECT * INTO v FROM chat.intervenciones_sos
    WHERE id_intervencion = p_id_intervencion
    FOR UPDATE;
    IF NOT FOUND OR v.estado <> 'EN_CURSO' THEN
        RETURN false;
    END IF;

    IF v_ahora >= v.fecha_limite THEN
        v_estado := 'EXPIRADA';
    ELSIF v_estado = 'COMPLETA' AND NOT EXISTS (
        SELECT 1 FROM chat.estado_sesiones es
        WHERE es.id_sesion = v.id_sesion_sos AND es.estado_actual = 'COMPLETADA'
    ) THEN
        v_estado := 'INCOMPLETA';
    END IF;

    UPDATE chat.intervenciones_sos
    SET estado = v_estado, fecha_cierre = LEAST(v_ahora, v.fecha_limite)
    WHERE id_intervencion = p_id_intervencion;

    INSERT INTO chat.eventos_seguimiento (
        id_sesion, id_usuario, modalidad, tipo_dependencia, tipo_craving,
        origen_evento, tipo_evento, id_intervencion_sos, timestamp
    ) VALUES (
        v.id_sesion_sos, v.id_usuario, 'SOS', NULL, v.tipo_craving,
        'SOS', 'CHAT_SOS_ACTIVADO', v.id_intervencion, v.fecha_activacion
    )
    ON CONFLICT (id_sesion, origen_evento) DO NOTHING;

    RETURN true;
END;
$$;

-- ---------------------------------------------------------------------
-- 5b. Coherencia modalidad/perfil en flujos y sesiones
-- ---------------------------------------------------------------------
-- Supabase tiene estas dos restricciones aunque ninguna migración las crea
-- (deriva previa). Solo aceptan GRUPAL y PERSONALIZADA: se reemplazan para
-- admitir SOS y quedan definidas aquí. SOS no lleva tipo de dependencia; la
-- sesión SOS puede llevar el tipo de craving del perfil vigente.
ALTER TABLE chat.flujo_conversacion DROP CONSTRAINT IF EXISTS ck_flujo_combinacion_coherente;
ALTER TABLE chat.flujo_conversacion ADD CONSTRAINT ck_flujo_combinacion_coherente CHECK (
    (modalidad IN ('GRUPAL', 'SOS') AND tipo_dependencia IS NULL AND tipo_craving IS NULL)
    OR (modalidad = 'PERSONALIZADA' AND tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
);

ALTER TABLE chat.sesiones DROP CONSTRAINT IF EXISTS ck_sesion_perfil_coherente;
ALTER TABLE chat.sesiones ADD CONSTRAINT ck_sesion_perfil_coherente CHECK (
    modalidad_activa = 'GRUPAL'
    OR (modalidad_activa = 'PERSONALIZADA' AND tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
    OR (modalidad_activa = 'SOS' AND tipo_dependencia IS NULL)
);

-- ---------------------------------------------------------------------
-- 6. Flujo SOS: un único publicado y versiones únicas (como el grupal)
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX uq_flujo_publicado_sos
    ON chat.flujo_conversacion (modalidad)
    WHERE estado = 'PUBLICADO' AND modalidad = 'SOS';
CREATE UNIQUE INDEX uq_flujo_version_sos
    ON chat.flujo_conversacion (version)
    WHERE modalidad = 'SOS';

CREATE OR REPLACE FUNCTION chat.fn_archivar_flujo_previo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'PUBLICADO' THEN
UPDATE chat.flujo_conversacion
SET estado = 'ARCHIVADO', fecha_archivado = now()
WHERE estado = 'PUBLICADO'
  AND modalidad = NEW.modalidad
  AND id_flujo <> NEW.id_flujo
  AND (
    (NEW.modalidad IN ('GRUPAL', 'SOS'))
        OR (NEW.modalidad = 'PERSONALIZADA'
        AND tipo_dependencia = NEW.tipo_dependencia
        AND tipo_craving = NEW.tipo_craving)
    );
NEW.fecha_publicacion := now();
END IF;
RETURN NEW;
END;
$function$;

-- Seed de la versión 1 (contenido provisional, pendiente de validación de
-- psicología). Necesita un usuario ADMINISTRATIVO como autor y el tipo de
-- nodo MENSAJE; si alguno falta (p. ej. una BD efímera de CI), se omite y el
-- flujo se crea con POST /chat/admin/flujos-sos.
-- Los nodos no esperan respuesta (CONTINUAR): avanzan por `orden` hasta el
-- nodo final (RF-25, avance implícito).
DO $$
DECLARE
    v_admin uuid;
    v_tipo uuid;
    v_flujo uuid := gen_random_uuid();
BEGIN
    IF EXISTS (SELECT 1 FROM chat.flujo_conversacion WHERE modalidad = 'SOS') THEN
        RETURN;
    END IF;
    SELECT id_usuario INTO v_admin FROM usuario.usuarios
    WHERE rol = 'ADMINISTRATIVO' AND estado_cuenta = 'ACTIVA'
    ORDER BY fecha_registro, id_usuario LIMIT 1;
    SELECT id_tipo_nodo INTO v_tipo FROM chat.tipo_nodo WHERE nombre = 'MENSAJE';
    IF v_admin IS NULL OR v_tipo IS NULL THEN
        RAISE NOTICE 'RF-43: se omite el seed del flujo SOS (falta un usuario ADMINISTRATIVO o el tipo de nodo MENSAJE).';
        RETURN;
    END IF;

    INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, estado, version, creado_por)
    VALUES (v_flujo, 'Protocolo SOS · craving', 'SOS', 'BORRADOR', 1, v_admin);

    INSERT INTO chat.nodos (id_flujo, id_tipo_nodo, contenido, es_nodo_inicial, es_nodo_final, orden, creado_por)
    VALUES
        (v_flujo, v_tipo, jsonb_build_object('bloques', jsonb_build_array(jsonb_build_object('orden', 1, 'tipo', 'TEXTO',
            'texto', 'Estoy aquí contigo. Las ganas de vapear suben como una ola y también bajan. Vamos a atravesarla juntos en menos de un minuto.'))),
         true, false, 1, v_admin),
        (v_flujo, v_tipo, jsonb_build_object('bloques', jsonb_build_array(jsonb_build_object('orden', 1, 'tipo', 'INSTRUCCION',
            'texto', 'Inhala por la nariz contando hasta 4, sostén el aire contando hasta 4 y exhala lentamente por la boca contando hasta 6. Repítelo tres veces.'))),
         false, false, 2, v_admin),
        (v_flujo, v_tipo, jsonb_build_object('bloques', jsonb_build_array(jsonb_build_object('orden', 1, 'tipo', 'TEXTO',
            'texto', 'Observa en qué parte de tu cuerpo sientes las ganas. No tienes que hacer nada con ellas: solo nótalas, como una ola que llega y se va.'))),
         false, false, 3, v_admin),
        (v_flujo, v_tipo, jsonb_build_object('bloques', jsonb_build_array(jsonb_build_object('orden', 1, 'tipo', 'TEXTO',
            'texto', 'Recuerda por qué decidiste dejar de vapear. Este deseo es pasajero y cada vez que lo dejas pasar se hace más débil.'))),
         false, false, 4, v_admin),
        (v_flujo, v_tipo, jsonb_build_object('bloques', jsonb_build_array(jsonb_build_object('orden', 1, 'tipo', 'TEXTO',
            'texto', 'Lo lograste. Si las ganas continúan o sientes que estás en crisis, tienes líneas de ayuda disponibles.'))),
         false, true, 5, v_admin);

    UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO' WHERE id_flujo = v_flujo;
END;
$$;

-- ---------------------------------------------------------------------
-- 7. Permisos
-- ---------------------------------------------------------------------
REVOKE ALL ON chat.recursos_apoyo, chat.intervenciones_sos FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION chat.fn_cerrar_intervencion_sos(uuid, chat.estado_intervencion_sos_enum) FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON chat.recursos_apoyo, chat.intervenciones_sos FROM anon;
        REVOKE ALL ON FUNCTION chat.fn_cerrar_intervencion_sos(uuid, chat.estado_intervencion_sos_enum) FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON chat.recursos_apoyo, chat.intervenciones_sos FROM authenticated;
        REVOKE ALL ON FUNCTION chat.fn_cerrar_intervencion_sos(uuid, chat.estado_intervencion_sos_enum) FROM authenticated;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'brisa_rw') THEN
        GRANT SELECT ON chat.recursos_apoyo TO brisa_rw;
        GRANT SELECT, INSERT ON chat.intervenciones_sos TO brisa_rw;
        GRANT UPDATE (estado, fecha_cierre, contexto_origen) ON chat.intervenciones_sos TO brisa_rw;
        GRANT EXECUTE ON FUNCTION chat.fn_cerrar_intervencion_sos(uuid, chat.estado_intervencion_sos_enum) TO brisa_rw;
    END IF;
END;
$$;

COMMIT;
