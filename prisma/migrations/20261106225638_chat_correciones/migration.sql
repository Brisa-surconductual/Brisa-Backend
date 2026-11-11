-- Migración: chat_correciones
-- Fecha: 2026-11-07T03:56:38.158Z
-- Descripción: [Describe qué hace esta migración]


-- =====================================================================
-- Migración: chat_correcciones_rf26_rf29
-- Proyecto : Brisa · Módulo M-3 Chat
-- Fecha    : 2026-11-06
-- Alcance  : C1, C2, C3 (modelo nodo/entrada/validación) y D1–D5 (integridad)
-- Ejecutar : con rol dba (ALTER TYPE exige ser owner del tipo).
-- Archivo  : UTF-8 SIN BOM (no editar/guardar desde PowerShell 5: corrompe a UTF-16).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. PRE-CHEQUEOS · abortan con mensaje claro si los datos actuales
--    violan las nuevas restricciones (nada se aplica parcialmente).
-- ---------------------------------------------------------------------
DO $$
DECLARE n integer;
BEGIN
  -- D2: contenido vacío o no-objeto
SELECT count(*) INTO n FROM chat.nodos
WHERE jsonb_typeof(contenido) <> 'object' OR contenido = '{}'::jsonb;
IF n > 0 THEN
    RAISE EXCEPTION 'D2: % nodo(s) con contenido vacío o que no es objeto JSON. Corregir antes de migrar.', n;
END IF;

  -- D3: orden de evaluación duplicado por nodo origen
SELECT count(*) INTO n FROM (
                                SELECT 1 FROM chat.reglas_nodos
                                GROUP BY id_nodo_origen, orden_evaluacion HAVING count(*) > 1) x;
IF n > 0 THEN
    RAISE EXCEPTION 'D3: % par(es) (id_nodo_origen, orden_evaluacion) duplicados.', n;
END IF;

  -- D5: transiciones que cruzan flujos/versiones
SELECT count(*) INTO n
FROM chat.reglas_nodos r
         JOIN chat.nodos o ON o.id_nodo = r.id_nodo_origen
         JOIN chat.nodos d ON d.id_nodo = r.id_nodo_destino
WHERE o.id_flujo <> r.id_flujo OR d.id_flujo <> r.id_flujo;
IF n > 0 THEN
    RAISE EXCEPTION 'D5: % regla(s) conectan nodos de un flujo distinto al declarado.', n;
END IF;

  -- D5b: sesiones cuyo nodo actual no pertenece a su flujo
SELECT count(*) INTO n
FROM chat.sesiones s JOIN chat.nodos nd ON nd.id_nodo = s.id_nodo_actual
WHERE nd.id_flujo <> s.id_flujo_conversacional;
IF n > 0 THEN
    RAISE EXCEPTION 'D5b: % sesión(es) con nodo actual de otro flujo.', n;
END IF;

  -- C2: un mismo nodo origen con reglas de validación distintas por transición
SELECT count(*) INTO n FROM (
                                SELECT 1 FROM chat.reglas_nodos
                                GROUP BY id_nodo_origen HAVING count(DISTINCT id_regla_validacion) > 1) x;
IF n > 0 THEN
    RAISE EXCEPTION 'C2: % nodo(s) origen con validaciones distintas por transición. Unificar a una sola antes de migrar.', n;
END IF;
END $$;


-- ---------------------------------------------------------------------
-- 1. ENUMS · valores nuevos (idempotente).
--    PG >= 12 permite ADD VALUE en transacción; no se usan en esta migración.
-- ---------------------------------------------------------------------
-- RF-26B: sesión sin árbol válido · RF-29: nodo terminal alcanzado
-- VERIFICAR que no existan ya con otro nombre (p. ej. FINALIZADA).
ALTER TYPE chat.estado_sesion_enum ADD VALUE IF NOT EXISTS 'ERROR_CONFIGURACION';
ALTER TYPE chat.estado_sesion_enum ADD VALUE IF NOT EXISTS 'COMPLETADA';

-- C3: regla de transición por defecto. El nombre del tipo de
-- operador_condicion no está documentado: se resuelve dinámicamente.
DO $$
DECLARE t regtype;
BEGIN
SELECT a.atttypid::regtype INTO t
FROM pg_attribute a
WHERE a.attrelid = 'chat.reglas_nodos'::regclass
     AND a.attname  = 'operador_condicion';
EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', t, 'SIEMPRE');
END $$;


-- ---------------------------------------------------------------------
-- 2. C1 · tipo de entrada definido en el nodo
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos
    ADD COLUMN id_tipo_entrada uuid NULL;

ALTER TABLE chat.nodos
    ADD CONSTRAINT fk_nodo_tipo_entrada
        FOREIGN KEY (id_tipo_entrada) REFERENCES chat.tipo_entrada (id_tipo_entrada);

CREATE INDEX idx_nodos_tipo_entrada ON chat.nodos (id_tipo_entrada);

COMMENT ON COLUMN chat.nodos.id_tipo_entrada IS
  'RF-27. Componente de entrada del nodo. NULL = nodo terminal (sin respuesta). Nodos informativos usan CONTINUAR.';


-- ---------------------------------------------------------------------
-- 3. C2 · la validación pertenece al NODO, no a la transición
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos
    ADD COLUMN id_regla_validacion uuid NULL;

ALTER TABLE chat.nodos
    ADD CONSTRAINT fk_nodo_regla_validacion
        FOREIGN KEY (id_regla_validacion) REFERENCES chat.reglas_validaciones (id_regla_validacion);

CREATE INDEX idx_nodos_regla_validacion ON chat.nodos (id_regla_validacion);

-- Backfill: la (única, por pre-chequeo C2) validación de las transiciones pasa al nodo origen
UPDATE chat.nodos n
SET id_regla_validacion = r.id_regla_validacion
    FROM (SELECT DISTINCT id_nodo_origen, id_regla_validacion FROM chat.reglas_nodos) r
WHERE r.id_nodo_origen = n.id_nodo;

-- Un nodo con validación debe tener tipo de entrada.
-- NOT VALID: aplica a escrituras nuevas; las filas backfilleadas aún no tienen
-- id_tipo_entrada. Cuando psicología lo complete, ejecutar:
--   ALTER TABLE chat.nodos VALIDATE CONSTRAINT ck_nodo_validacion_requiere_entrada;
ALTER TABLE chat.nodos
    ADD CONSTRAINT ck_nodo_validacion_requiere_entrada
        CHECK (id_regla_validacion IS NULL OR id_tipo_entrada IS NOT NULL) NOT VALID;

-- Fuente única de verdad: se elimina la validación por transición
ALTER TABLE chat.reglas_nodos DROP CONSTRAINT fk_regla_validacion;
ALTER TABLE chat.reglas_nodos DROP COLUMN id_regla_validacion;

COMMENT ON COLUMN chat.reglas_validaciones.valor_max IS
  'Máximo numérico/escala; en MULTISELECCION = cantidad máxima de opciones; en TEXTO_LIBRE = longitud máxima en caracteres.';


-- ---------------------------------------------------------------------
-- 4. C3 · catálogo: tipo de entrada CONTINUAR (acuse de lectura)
-- ---------------------------------------------------------------------
INSERT INTO chat.tipo_entrada (nombre) VALUES ('CONTINUAR')
    ON CONFLICT (nombre) DO NOTHING;


-- ---------------------------------------------------------------------
-- 5. D1 · perfil_completo debe ser columna GENERADA.
--    Postgres prohíbe referencias a columnas en DEFAULT, así que el
--    "DEFAULT ((tipo_dependencia IS NOT NULL)...)" del export de Supabase
--    probablemente ya es GENERATED. Se verifica y solo se corrige si no lo es.
--    Si alguna vista/función depende de la columna, el DROP fallará: recrearla después.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
     WHERE attrelid = 'chat.perfil_clinico'::regclass
       AND attname  = 'perfil_completo'
       AND attgenerated = 's') THEN
ALTER TABLE chat.perfil_clinico DROP COLUMN perfil_completo;
ALTER TABLE chat.perfil_clinico
    ADD COLUMN perfil_completo boolean NOT NULL
        GENERATED ALWAYS AS (tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL) STORED;
RAISE NOTICE 'D1: perfil_completo convertida a GENERATED.';
ELSE
    RAISE NOTICE 'D1: perfil_completo ya era GENERATED. Sin cambios.';
END IF;
END $$;

COMMENT ON COLUMN chat.perfil_clinico.perfil_completo IS
  'RF-27B. Calculada por la BD. La aplicación NUNCA debe escribirla.';


-- ---------------------------------------------------------------------
-- 6. D2 · contenido del nodo: objeto JSON no vacío
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos
    ADD CONSTRAINT ck_nodo_contenido_objeto_no_vacio
        CHECK (jsonb_typeof(contenido) = 'object' AND contenido <> '{}'::jsonb);

COMMENT ON COLUMN chat.nodos.contenido IS
  'RF-26. Esquema v1: {version, bloques[{orden,tipo,texto|idRecurso}], entrada{opciones,etiquetas}, capturaPerfil{dimension}}.';


-- ---------------------------------------------------------------------
-- 7. D3 · transición determinística: un orden por nodo origen
--    DEFERRABLE para permitir el reordenamiento en dos fases dentro de una transacción.
--    Nota: no puede usarse como árbitro de ON CONFLICT.
-- ---------------------------------------------------------------------
ALTER TABLE chat.reglas_nodos
    ADD CONSTRAINT uq_reglas_nodos_origen_orden
        UNIQUE (id_nodo_origen, orden_evaluacion) DEFERRABLE INITIALLY DEFERRED;


-- ---------------------------------------------------------------------
-- 8. D4 · nombre honesto: la columna apunta a cronograma.contenidos
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos RENAME COLUMN id_contenido_cronograma TO id_contenido;
ALTER TABLE chat.nodos RENAME CONSTRAINT fk_nodo_contenido_cronograma TO fk_nodo_contenido;


-- ---------------------------------------------------------------------
-- 9. D5 · las transiciones (y la sesión) no pueden cruzar flujos/versiones
--    FK compuestas: integridad declarativa, sin triggers.
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos
    ADD CONSTRAINT uq_nodos_id_flujo UNIQUE (id_nodo, id_flujo);

ALTER TABLE chat.reglas_nodos DROP CONSTRAINT fk_regla_nodo_origen;
ALTER TABLE chat.reglas_nodos DROP CONSTRAINT fk_regla_nodo_destino;

ALTER TABLE chat.reglas_nodos
    ADD CONSTRAINT fk_regla_nodo_origen
        FOREIGN KEY (id_nodo_origen, id_flujo) REFERENCES chat.nodos (id_nodo, id_flujo);

ALTER TABLE chat.reglas_nodos
    ADD CONSTRAINT fk_regla_nodo_destino
        FOREIGN KEY (id_nodo_destino, id_flujo) REFERENCES chat.nodos (id_nodo, id_flujo);

CREATE INDEX idx_reglas_nodos_destino ON chat.reglas_nodos (id_nodo_destino, id_flujo);

-- D5b: el nodo actual de la sesión pertenece al flujo de la sesión (soporta RF-26)
ALTER TABLE chat.sesiones DROP CONSTRAINT fk_sesion_nodo_actual;

ALTER TABLE chat.sesiones
    ADD CONSTRAINT fk_sesion_nodo_actual
        FOREIGN KEY (id_nodo_actual, id_flujo_conversacional) REFERENCES chat.nodos (id_nodo, id_flujo);

CREATE INDEX idx_sesiones_nodo_actual ON chat.sesiones (id_nodo_actual, id_flujo_conversacional);