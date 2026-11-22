-- =====================================================================
-- RF-30B (provisional) · Taxonomía de variables y etiquetado de respuestas
-- Contrato: docs/CONTRATO_RF30B_TAXONOMIA_VARIABLES.md
--   · chat.taxonomia_versiones   : versión global de la taxonomía (inmutable)
--   · chat.taxonomia_variables   : variables; solo cambia `habilitada`
--   · chat.variables_etiquetadas : respuestas etiquetadas (inmutable)
-- =====================================================================
BEGIN;

CREATE TYPE chat.tipo_valor_variable_enum AS ENUM ('ENTERO', 'CATEGORIA', 'BOOLEANO');
CREATE TYPE chat.estado_etiquetado_enum AS ENUM ('COMPLETO', 'PENDIENTE_PERFIL');

-- ---------------------------------------------------------------------
-- 1. Versiones globales de la taxonomía
-- ---------------------------------------------------------------------
CREATE TABLE chat.taxonomia_versiones (
    id_version bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version varchar(20) NOT NULL,
    accion varchar(40) NOT NULL,
    codigo_variable varchar(60),
    id_actor uuid REFERENCES usuario.usuarios (id_usuario),
    fecha timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_taxonomia_version UNIQUE (version),
    CONSTRAINT ck_taxonomia_version_formato CHECK (version ~ '^[0-9]+\.[0-9]+$')
);

COMMENT ON TABLE chat.taxonomia_versiones IS
  'RF-30B. Cada escritura administrativa de la taxonomía crea la versión siguiente (1.0 → 1.1 …).';

CREATE TRIGGER trg_taxonomia_versiones_inmutables
    BEFORE UPDATE OR DELETE ON chat.taxonomia_versiones
    FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_modificacion();

-- ---------------------------------------------------------------------
-- 2. Variables de la taxonomía
-- ---------------------------------------------------------------------
CREATE TABLE chat.taxonomia_variables (
    id_variable uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo varchar(60) NOT NULL,
    nombre varchar(120) NOT NULL,
    descripcion varchar(500),
    tipo_valor chat.tipo_valor_variable_enum NOT NULL,
    valores text[],
    tipos_entrada_permitidos text[] NOT NULL,
    etiquetas jsonb NOT NULL,
    habilitada boolean NOT NULL DEFAULT true,
    creado_por uuid REFERENCES usuario.usuarios (id_usuario),
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_taxonomia_variable_codigo UNIQUE (codigo),
    CONSTRAINT ck_taxonomia_variable_codigo CHECK (codigo ~ '^[A-Z][A-Z0-9_]{1,59}$'),
    CONSTRAINT ck_taxonomia_variable_nombre CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_taxonomia_variable_entradas CHECK (
        cardinality(tipos_entrada_permitidos) > 0 AND (
            (tipo_valor = 'ENTERO' AND tipos_entrada_permitidos <@ ARRAY['ESCALA', 'NUMERICO']::text[])
            OR (tipo_valor = 'CATEGORIA' AND tipos_entrada_permitidos <@ ARRAY['OPCION_UNICA', 'MULTISELECCION']::text[])
            OR (tipo_valor = 'BOOLEANO' AND tipos_entrada_permitidos <@ ARRAY['BOOLEANO']::text[])
        )
    ),
    CONSTRAINT ck_taxonomia_variable_valores CHECK (
        (tipo_valor = 'CATEGORIA' AND valores IS NOT NULL AND cardinality(valores) > 0)
        OR (tipo_valor <> 'CATEGORIA' AND valores IS NULL)
    ),
    CONSTRAINT ck_taxonomia_variable_etiquetas CHECK (
        (tipo_valor = 'ENTERO' AND jsonb_typeof(etiquetas) = 'array')
        OR (tipo_valor <> 'ENTERO' AND jsonb_typeof(etiquetas) = 'object')
    )
);

COMMENT ON TABLE chat.taxonomia_variables IS
  'RF-30B. Variables que un nodo puede capturar. La definición no se edita ni se borra; solo se habilita o deshabilita.';

CREATE FUNCTION chat.fn_taxonomia_variable_definicion_inmutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Las variables de la taxonomía no se eliminan: deshabilítalas.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF (NEW.id_variable, NEW.codigo, NEW.nombre, NEW.descripcion, NEW.tipo_valor, NEW.valores,
        NEW.tipos_entrada_permitidos, NEW.etiquetas, NEW.creado_por, NEW.fecha_creacion)
       IS DISTINCT FROM
       (OLD.id_variable, OLD.codigo, OLD.nombre, OLD.descripcion, OLD.tipo_valor, OLD.valores,
        OLD.tipos_entrada_permitidos, OLD.etiquetas, OLD.creado_por, OLD.fecha_creacion) THEN
        RAISE EXCEPTION 'La definición de una variable de la taxonomía es inmutable: solo cambia habilitada.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_taxonomia_variable_definicion_inmutable
    BEFORE UPDATE OR DELETE ON chat.taxonomia_variables
    FOR EACH ROW EXECUTE FUNCTION chat.fn_taxonomia_variable_definicion_inmutable();

-- ---------------------------------------------------------------------
-- 3. Respuestas etiquetadas
-- ---------------------------------------------------------------------
CREATE TABLE chat.variables_etiquetadas (
    id_variable_etiquetada uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_interaccion uuid NOT NULL REFERENCES chat.interacciones (id_interaccion),
    id_sesion uuid NOT NULL REFERENCES chat.sesiones (id_sesion),
    id_usuario uuid NOT NULL REFERENCES usuario.usuarios (id_usuario),
    id_nodo uuid NOT NULL REFERENCES chat.nodos (id_nodo),
    id_variable uuid NOT NULL REFERENCES chat.taxonomia_variables (id_variable),
    codigo_variable varchar(60) NOT NULL,
    valor jsonb NOT NULL,
    elementos jsonb NOT NULL,
    modalidad chat.modalidad_enum NOT NULL,
    tipo_dependencia chat.tipo_dependencia_enum,
    tipo_craving chat.tipo_craving_enum,
    estado_etiquetado chat.estado_etiquetado_enum NOT NULL,
    version_taxonomia varchar(20) NOT NULL REFERENCES chat.taxonomia_versiones (version),
    secuencia integer NOT NULL,
    timestamp_interaccion timestamptz NOT NULL,
    fecha_registro timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_variable_etiquetada_interaccion UNIQUE (id_interaccion),
    CONSTRAINT ck_variable_etiquetada_secuencia CHECK (secuencia > 0),
    CONSTRAINT ck_variable_etiquetada_elementos CHECK (
        jsonb_typeof(elementos) = 'array' AND jsonb_array_length(elementos) > 0
    ),
    CONSTRAINT ck_variable_etiquetada_estado CHECK (
        (estado_etiquetado = 'COMPLETO') = (tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
    )
);

COMMENT ON TABLE chat.variables_etiquetadas IS
  'RF-30B. Respuesta etiquetada según la taxonomía, con snapshot del perfil clínico. Inmutable.';

CREATE INDEX ix_variables_etiquetadas_sesion ON chat.variables_etiquetadas (id_sesion, secuencia);
CREATE INDEX ix_variables_etiquetadas_usuario_codigo
    ON chat.variables_etiquetadas (id_usuario, codigo_variable, timestamp_interaccion);

CREATE TRIGGER trg_variables_etiquetadas_inmutables
    BEFORE UPDATE OR DELETE ON chat.variables_etiquetadas
    FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_modificacion();

-- ---------------------------------------------------------------------
-- 4. Seed · versión 1.0 (propuesta inicial; psicología la ajusta desde el API)
-- ---------------------------------------------------------------------
INSERT INTO chat.taxonomia_versiones (version, accion) VALUES ('1.0', 'CARGA_INICIAL');

INSERT INTO chat.taxonomia_variables (codigo, nombre, descripcion, tipo_valor, valores, tipos_entrada_permitidos, etiquetas)
VALUES
    ('NIVEL_CRAVING', 'Nivel de craving',
     'Intensidad del deseo de vapear reportada por el estudiante.',
     'ENTERO', NULL, ARRAY['ESCALA', 'NUMERICO'],
     '[{"min":0,"max":3,"etiqueta":"CRAVING_BAJO"},{"min":4,"max":6,"etiqueta":"CRAVING_MODERADO"},{"min":7,"max":10,"etiqueta":"CRAVING_ALTO"}]'::jsonb),
    ('FRECUENCIA_VAPEO', 'Frecuencia de vapeo',
     'Veces que el estudiante vapeó en el periodo indicado por el nodo.',
     'ENTERO', NULL, ARRAY['ESCALA', 'NUMERICO'],
     '[{"min":0,"max":0,"etiqueta":"SIN_CONSUMO"},{"min":1,"max":5,"etiqueta":"FRECUENCIA_BAJA"},{"min":6,"max":15,"etiqueta":"FRECUENCIA_MEDIA"},{"min":16,"max":null,"etiqueta":"FRECUENCIA_ALTA"}]'::jsonb),
    ('CONTEXTO_EMOCIONAL', 'Contexto emocional',
     'Emoción o estado de ánimo asociado al deseo o al consumo.',
     'CATEGORIA',
     ARRAY['ANSIEDAD', 'ESTRES', 'TRISTEZA', 'ABURRIMIENTO', 'ENOJO', 'SOLEDAD', 'ALEGRIA', 'CALMA'],
     ARRAY['OPCION_UNICA', 'MULTISELECCION'],
     '{}'::jsonb),
    ('SITUACION_RIESGO', 'Situación de riesgo',
     'Indica si el estudiante está o estuvo en una situación de riesgo de consumo.',
     'BOOLEANO', NULL, ARRAY['BOOLEANO'],
     '{"true":"RIESGO_PRESENTE","false":"RIESGO_AUSENTE"}'::jsonb);

-- ---------------------------------------------------------------------
-- 5. Permisos
-- ---------------------------------------------------------------------
REVOKE ALL ON chat.taxonomia_versiones, chat.taxonomia_variables, chat.variables_etiquetadas FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION chat.fn_taxonomia_variable_definicion_inmutable() FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON chat.taxonomia_versiones, chat.taxonomia_variables, chat.variables_etiquetadas FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON chat.taxonomia_versiones, chat.taxonomia_variables, chat.variables_etiquetadas FROM authenticated;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'brisa_rw') THEN
        GRANT SELECT, INSERT ON chat.taxonomia_versiones, chat.taxonomia_variables, chat.variables_etiquetadas TO brisa_rw;
        GRANT UPDATE (habilitada, fecha_actualizacion) ON chat.taxonomia_variables TO brisa_rw;
    END IF;
END;
$$;

COMMIT;
