-- =====================================================================
-- Migración: chat_etapa3_persistencia_offline
-- Proyecto : Brisa · M-3 Chat · Etapa 3 (RF-30 a RF-35, RF-34B, RF-38)
-- Fecha    : 2026-11-13
-- Alcance  : B1 inmutabilidad · B2 secuencia · B4 sin estado_sincronizacion en servidor
--            B5 versión de árbol coherente · B6 historial ligado a la interacción
--            B7 eventos de sincronización · B8 registro de precarga · B10 recursos no presentados
--            (B3 idempotencia y B9 integridad multimedia no requieren cambios de esquema)
-- Requiere : migraciones 20261106170000_chat_correcciones_rf26_rf29 y
--            20261106233000_recrear_funciones_triggers_bd ya aplicadas.
-- Ejecutar : con rol dba (ALTER TYPE exige ser owner). Guardar en UTF-8 sin BOM.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. PRE-CHEQUEOS · abortan con un mensaje claro; nada se aplica a medias
-- ---------------------------------------------------------------------
DO $$
DECLARE n integer;
BEGIN
  -- B5: sesiones cuya versión no coincide con la de su flujo
  SELECT count(*) INTO n
    FROM chat.sesiones s
    JOIN chat.flujo_conversacion f ON f.id_flujo = s.id_flujo_conversacional
   WHERE s.version_arbol_utilizada <> f.version;
  IF n > 0 THEN
    RAISE EXCEPTION 'B5: % sesión(es) con version_arbol_utilizada distinta a la versión de su flujo. Corregir antes de migrar.', n;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 1. B2 · orden cronológico por secuencia (RF-30, RF-34, RF-35)
--    El reloj del dispositivo puede estar desfasado: el orden lo da la
--    secuencia por sesión, no la fecha.
-- ---------------------------------------------------------------------
ALTER TABLE chat.interacciones ADD COLUMN secuencia integer;

-- Backfill: numera las interacciones existentes por sesión en orden de registro
UPDATE chat.interacciones i
   SET secuencia = x.rn
  FROM (SELECT id_interaccion,
               row_number() OVER (PARTITION BY id_sesion
                                  ORDER BY timestamp_interaccion, fecha_creacion, id_interaccion) AS rn
          FROM chat.interacciones) x
 WHERE x.id_interaccion = i.id_interaccion;

ALTER TABLE chat.interacciones ALTER COLUMN secuencia SET NOT NULL;

ALTER TABLE chat.interacciones
  ADD CONSTRAINT ck_interaccion_secuencia_positiva CHECK (secuencia > 0);

ALTER TABLE chat.interacciones
  ADD CONSTRAINT uq_interacciones_sesion_secuencia UNIQUE (id_sesion, secuencia);

COMMENT ON COLUMN chat.interacciones.secuencia IS
  'RF-30. Orden de la interacción dentro de la sesión, asignado en el dispositivo (también en línea). Único por sesión.';
COMMENT ON COLUMN chat.interacciones.timestamp_interaccion IS
  'RF-30. Fecha y hora de la interacción en el dispositivo (enviada por el cliente). No define el orden.';
COMMENT ON COLUMN chat.interacciones.fecha_creacion IS
  'RF-30. Fecha y hora en que el servidor registró la interacción (en línea o al sincronizar).';
COMMENT ON COLUMN chat.interacciones.id_interaccion IS
  'RF-30/RF-35. UUID generado en el dispositivo: un reenvío choca con la PK y se trata como duplicado (B3).';


-- ---------------------------------------------------------------------
-- 2. B10 · recursos multimedia no presentados sin conexión (RF-34)
-- ---------------------------------------------------------------------
ALTER TABLE chat.interacciones ADD COLUMN recursos_no_presentados uuid[] NULL;

ALTER TABLE chat.interacciones
  ADD CONSTRAINT ck_interaccion_recursos_no_presentados
  CHECK (recursos_no_presentados IS NULL OR cardinality(recursos_no_presentados) > 0);

COMMENT ON COLUMN chat.interacciones.recursos_no_presentados IS
  'RF-34. Recursos (cronograma.recursos_contenido) que no se presentaron por no estar en la caché local. NULL = todos presentados.';


-- ---------------------------------------------------------------------
-- 3. B4 · en el servidor toda fila registrada ya está sincronizada.
--    El origen de la captura queda en chat.respuestas.id_estado_conectividad.
--    El tipo chat.estado_sincronizacion_enum se conserva (no se elimina).
-- ---------------------------------------------------------------------
ALTER TABLE chat.interacciones DROP COLUMN estado_sincronizacion;
ALTER TABLE chat.sesiones      DROP COLUMN estado_sincronizacion;

-- Catálogo de conectividad usado por RF-27/RF-30/RF-34.
-- VERIFICAR que no existan ya con otro nombre (p. ej. ONLINE/OFFLINE).
INSERT INTO chat.estado_conectividad (nombre) VALUES ('EN_LINEA'), ('SIN_CONEXION')
ON CONFLICT (nombre) DO NOTHING;


-- ---------------------------------------------------------------------
-- 4. B5 · la versión de la sesión es la de su flujo (RF-31, D3)
--    La BD lo garantiza; el backend ya no necesita validarlo.
-- ---------------------------------------------------------------------
ALTER TABLE chat.flujo_conversacion
  ADD CONSTRAINT uq_flujo_id_version UNIQUE (id_flujo, version);

ALTER TABLE chat.sesiones
  ADD CONSTRAINT fk_sesion_flujo_version
  FOREIGN KEY (id_flujo_conversacional, version_arbol_utilizada)
  REFERENCES chat.flujo_conversacion (id_flujo, version);

COMMENT ON COLUMN chat.sesiones.version_arbol_utilizada IS
  'RF-31. Versión fijada al iniciar la sesión; se conserva hasta completarla aunque el árbol se archive (D3).';


-- ---------------------------------------------------------------------
-- 5. B6 · cada paso del historial apunta a la interacción que lo originó
--    (RF-31, RF-38). Nullable: los registros previos no se pueden enlazar.
-- ---------------------------------------------------------------------
ALTER TABLE chat.historial_nodos ADD COLUMN id_interaccion uuid NULL;

ALTER TABLE chat.historial_nodos
  ADD CONSTRAINT fk_historial_interaccion
  FOREIGN KEY (id_interaccion) REFERENCES chat.interacciones (id_interaccion);

ALTER TABLE chat.historial_nodos
  ADD CONSTRAINT uq_historial_interaccion UNIQUE (id_interaccion);

COMMENT ON COLUMN chat.historial_nodos.id_interaccion IS
  'RF-31/RF-38. Interacción registrada en la misma transacción (RF-30). NULL solo en registros anteriores a esta migración.';


-- ---------------------------------------------------------------------
-- 6. B7 · evento de sincronización diferida (RF-35)
--    Una fila por lote; un lote pertenece a una sola sesión.
-- ---------------------------------------------------------------------
CREATE TABLE chat.eventos_sincronizacion (
  id_evento                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario               uuid        NOT NULL,
  id_sesion                uuid        NOT NULL,
  total_recibidas          integer     NOT NULL,
  sincronizadas            integer     NOT NULL,
  duplicadas               integer     NOT NULL,
  rechazadas               integer     NOT NULL,
  pendientes               integer     NOT NULL,
  id_interaccion_rechazada uuid        NULL,   -- id generado en el dispositivo; puede no existir en el servidor
  codigo_rechazo           varchar(60) NULL,   -- código de error de RF-28/RF-29
  fecha_inicio             timestamptz NOT NULL DEFAULT now(),
  fecha_fin                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_evento_sync_usuario FOREIGN KEY (id_usuario) REFERENCES usuario.usuarios (id_usuario),
  CONSTRAINT fk_evento_sync_sesion  FOREIGN KEY (id_sesion)  REFERENCES chat.sesiones (id_sesion),
  CONSTRAINT ck_evento_sync_no_negativos
    CHECK (total_recibidas >= 0 AND sincronizadas >= 0 AND duplicadas >= 0 AND rechazadas >= 0 AND pendientes >= 0),
  CONSTRAINT ck_evento_sync_total
    CHECK (total_recibidas = sincronizadas + duplicadas + rechazadas + pendientes),
  -- D4: la primera rechazada detiene el lote -> a lo sumo una rechazada
  CONSTRAINT ck_evento_sync_un_rechazo CHECK (rechazadas IN (0, 1)),
  CONSTRAINT ck_evento_sync_rechazo_coherente
    CHECK ((rechazadas = 0 AND id_interaccion_rechazada IS NULL AND codigo_rechazo IS NULL)
        OR (rechazadas = 1 AND id_interaccion_rechazada IS NOT NULL AND codigo_rechazo IS NOT NULL)),
  CONSTRAINT ck_evento_sync_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_eventos_sync_usuario_fecha ON chat.eventos_sincronizacion (id_usuario, fecha_inicio DESC);
CREATE INDEX idx_eventos_sync_sesion        ON chat.eventos_sincronizacion (id_sesion);

COMMENT ON TABLE chat.eventos_sincronizacion IS
  'RF-35. Registro inmutable de cada lote de sincronización diferida.';


-- ---------------------------------------------------------------------
-- 7. B8 · chat.sincronizaciones es el registro de PRECARGA (RF-34B)
-- ---------------------------------------------------------------------
COMMENT ON TABLE chat.sincronizaciones IS
  'RF-34B. Registro de precargas del paquete offline (no confundir con chat.eventos_sincronizacion, RF-35).';

-- El espacio libre de un dispositivo supera fácilmente 2^31 bytes: bigint
ALTER TABLE chat.sincronizaciones
  ALTER COLUMN limite_almacenamiento_local    TYPE bigint,
  ALTER COLUMN espacio_disponible_dispositivo TYPE bigint;

ALTER TABLE chat.sincronizaciones
  ADD CONSTRAINT ck_precarga_tamanos_no_negativos
  CHECK ((limite_almacenamiento_local IS NULL OR limite_almacenamiento_local >= 0)
     AND (espacio_disponible_dispositivo IS NULL OR espacio_disponible_dispositivo >= 0));

COMMENT ON COLUMN chat.sincronizaciones.limite_almacenamiento_local    IS 'RF-34B. Bytes.';
COMMENT ON COLUMN chat.sincronizaciones.espacio_disponible_dispositivo IS 'RF-34B. Bytes.';

-- La versión del árbol es (id_flujo, version): se agrega el flujo descargado
ALTER TABLE chat.sincronizaciones ADD COLUMN id_flujo uuid NULL;

ALTER TABLE chat.sincronizaciones
  ADD CONSTRAINT fk_precarga_flujo
  FOREIGN KEY (id_flujo) REFERENCES chat.flujo_conversacion (id_flujo);

-- Estados de precarga de RF-34B (idempotente)
ALTER TYPE chat.estado_precarga_enum ADD VALUE IF NOT EXISTS 'PENDIENTE';
ALTER TYPE chat.estado_precarga_enum ADD VALUE IF NOT EXISTS 'COMPLETA';
ALTER TYPE chat.estado_precarga_enum ADD VALUE IF NOT EXISTS 'PARCIAL';
ALTER TYPE chat.estado_precarga_enum ADD VALUE IF NOT EXISTS 'FALLIDA';


-- ---------------------------------------------------------------------
-- 8. B1 · inmutabilidad (RF-30, RF-38) · al final, después de los backfills
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION chat.fn_bloquear_modificacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Los registros de chat.% son inmutables: no se permite %', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$function$;

DROP TRIGGER IF EXISTS trg_interacciones_inmutables ON chat.interacciones;
CREATE TRIGGER trg_interacciones_inmutables
  BEFORE UPDATE OR DELETE ON chat.interacciones
  FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_modificacion();

DROP TRIGGER IF EXISTS trg_respuestas_inmutables ON chat.respuestas;
CREATE TRIGGER trg_respuestas_inmutables
  BEFORE UPDATE OR DELETE ON chat.respuestas
  FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_modificacion();

DROP TRIGGER IF EXISTS trg_eventos_sincronizacion_inmutables ON chat.eventos_sincronizacion;
CREATE TRIGGER trg_eventos_sincronizacion_inmutables
  BEFORE UPDATE OR DELETE ON chat.eventos_sincronizacion
  FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_modificacion();

-- historial_nodos: se asegura el trigger de RF-38 (idempotente, misma función de siempre)
DROP TRIGGER IF EXISTS trg_bloquear_edicion_historial ON chat.historial_nodos;
CREATE TRIGGER trg_bloquear_edicion_historial
  BEFORE UPDATE OR DELETE ON chat.historial_nodos
  FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_edicion_historial();