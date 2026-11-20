-- Migración: modulo_cronograma
-- Fecha: 2026-11-20T20:43:14.108Z
-- Descripción: 
-- =====================================================================
-- Migracion:  m08_administrativo
-- Modulo M-8 Administrativo (RF-122 a RF-151)
-- Dialecto: PostgreSQL 15+ (Supabase). Ejecutar con el rol dba.
-- Orden: schema, enums, tablas, indices, FKs, checks, funciones/triggers,
--        procedimientos (funciones), vistas, cambios en otros esquemas, grants.
-- Todo corre en una sola transaccion implicita: si algo falla, no queda nada.
-- =====================================================================

-- 1. ESQUEMA ----------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "administrativo";

-- 2. ENUMS ------------------------------------------------------------
CREATE TYPE "administrativo"."estado_cohorte_enum" AS ENUM ('BORRADOR', 'ACTIVA', 'INACTIVA');
CREATE TYPE "administrativo"."estado_participante_cohorte_enum" AS ENUM ('ACTIVO', 'INACTIVO', 'PENDIENTE_VALIDACION');
CREATE TYPE "administrativo"."estado_transicion_enum" AS ENUM ('AUTORIZADA', 'RECHAZADA', 'PENDIENTE_VALIDACION');
CREATE TYPE "administrativo"."alcance_permiso_enum" AS ENUM ('ACCESO_INDIVIDUAL', 'PROGRESION_NARRATIVA');
CREATE TYPE "administrativo"."accion_admin_enum" AS ENUM (
  'ACCESO_MODULO', 'CONSULTA_PARTICIPANTE', 'CONSULTA_AGREGADA', 'EXPORTACION_DATOS',
  'CONFIGURACION_UMBRALES', 'CONFIGURACION_NOTIFICACIONES', 'GESTION_MENSAJES_NOTIFICACION',
  'GESTION_CONTENIDO_NARRATIVO', 'GESTION_COHORTE', 'GESTION_PARTICIPANTE_COHORTE', 'GESTION_PAUSA',
  'AUTORIZACION_TRANSICION', 'GESTION_PERMISO_INDIVIDUAL', 'GESTION_ALERTA', 'VALIDACION_MAPEO_NARRATIVO',
  'DESCARGA_REPORTE', 'INTENTO_ACCESO_NO_AUTORIZADO', 'INTENTO_ESCRITURA_BLOQUEADO',
  'INTENTO_EXTRACCION_RESTRINGIDA');
CREATE TYPE "administrativo"."estado_accion_enum" AS ENUM ('EXITOSA', 'FALLIDA', 'DENEGADA');
CREATE TYPE "administrativo"."severidad_auditoria_enum" AS ENUM ('BAJA', 'MEDIA', 'ALTA');
CREATE TYPE "administrativo"."tipo_alerta_enum" AS ENUM ('CRAVING_ELEVADO', 'INACTIVIDAD');
CREATE TYPE "administrativo"."estado_gestion_alerta_enum" AS ENUM ('ATENDIDA');
CREATE TYPE "administrativo"."estado_reporte_enum" AS ENUM ('EN_COLA', 'EN_PROCESO', 'GENERADO', 'ERROR');
CREATE TYPE "administrativo"."vista_agregada_enum" AS ENUM ('CONDUCTUAL', 'NARRATIVA', 'NOTIFICACIONES');

-- 3. TABLAS -----------------------------------------------------------
CREATE TABLE "administrativo"."cohortes" (
  "id_cohorte" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nombre_cohorte" VARCHAR(150) NOT NULL,
  "fecha_inicio_programa" DATE NOT NULL,
  "fecha_fin_programa" DATE NOT NULL,
  "id_cronograma" UUID NOT NULL,
  "estado" "administrativo"."estado_cohorte_enum" NOT NULL DEFAULT 'BORRADOR',
  "fecha_activacion" TIMESTAMPTZ(6),
  "fecha_inactivacion" TIMESTAMPTZ(6),
  "creado_por" UUID NOT NULL,
  "actualizado_por" UUID,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_eliminacion" TIMESTAMPTZ(6),
  CONSTRAINT "cohortes_pkey" PRIMARY KEY ("id_cohorte")
);

CREATE TABLE "administrativo"."cohorte_participantes" (
  "id_cohorte_participante" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_cohorte" UUID NOT NULL,
  "id_usuario" UUID NOT NULL,
  "estado" "administrativo"."estado_participante_cohorte_enum" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
  "actualizado_por" UUID NOT NULL,
  "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_retiro" TIMESTAMPTZ(6),
  CONSTRAINT "cohorte_participantes_pkey" PRIMARY KEY ("id_cohorte_participante")
);

CREATE TABLE "administrativo"."cohorte_participantes_historial" (
  "id_historial" BIGSERIAL NOT NULL,
  "id_cohorte_participante" UUID NOT NULL,
  "estado_anterior" "administrativo"."estado_participante_cohorte_enum",
  "estado_nuevo" "administrativo"."estado_participante_cohorte_enum" NOT NULL,
  "id_usuario_administrativo" UUID NOT NULL,
  "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cohorte_participantes_historial_pkey" PRIMARY KEY ("id_historial")
);

CREATE TABLE "administrativo"."seudonimos_participante" (
  "id_usuario" UUID NOT NULL,
  "codigo_participante" VARCHAR(16) NOT NULL,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seudonimos_participante_pkey" PRIMARY KEY ("id_usuario")
);

CREATE TABLE "administrativo"."autorizaciones_transicion_modalidad" (
  "id_autorizacion" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_cohorte" UUID NOT NULL,
  "modalidad_origen" "chat"."modalidad_enum" NOT NULL DEFAULT 'GRUPAL',
  "modalidad_destino" "chat"."modalidad_enum" NOT NULL DEFAULT 'PERSONALIZADA',
  "estado_transicion" "administrativo"."estado_transicion_enum" NOT NULL,
  "total_participantes_evaluados" INTEGER NOT NULL,
  "total_perfiles_incompletos" INTEGER NOT NULL,
  "id_usuario_administrativo" UUID NOT NULL,
  "fecha_solicitud" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_autorizacion" TIMESTAMPTZ(6),
  "fecha_consumo" TIMESTAMPTZ(6),
  CONSTRAINT "autorizaciones_transicion_modalidad_pkey" PRIMARY KEY ("id_autorizacion")
);

CREATE TABLE "administrativo"."permisos_acceso_individual" (
  "id_permiso" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_usuario_administrativo" UUID NOT NULL,
  "id_participante" UUID NOT NULL,
  "alcance" "administrativo"."alcance_permiso_enum" NOT NULL,
  "fecha_inicio_vigencia" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_fin_vigencia" TIMESTAMPTZ(6),
  "revocado_en" TIMESTAMPTZ(6),
  "otorgado_por" UUID NOT NULL,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permisos_acceso_individual_pkey" PRIMARY KEY ("id_permiso")
);

CREATE TABLE "administrativo"."alertas_gestion_admin" (
  "id_alerta_gestion" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_alerta_externo" UUID NOT NULL,
  "tipo_alerta" "administrativo"."tipo_alerta_enum" NOT NULL,
  "id_participante" UUID NOT NULL,
  "id_cohorte" UUID,
  "estado" "administrativo"."estado_gestion_alerta_enum" NOT NULL DEFAULT 'ATENDIDA',
  "atendida_por" UUID NOT NULL,
  "fecha_atencion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "alertas_gestion_admin_pkey" PRIMARY KEY ("id_alerta_gestion")
);

CREATE TABLE "administrativo"."bitacora_auditoria" (
  "id_auditoria" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_usuario_administrativo" UUID,
  "id_sesion" UUID,
  "accion" "administrativo"."accion_admin_enum" NOT NULL,
  "recurso_afectado" VARCHAR(100) NOT NULL,
  "id_recurso" UUID,
  "id_participante" UUID,
  "direccion_ip" VARCHAR(45) NOT NULL,
  "marca_temporal" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "estado_accion" "administrativo"."estado_accion_enum" NOT NULL,
  "severidad" "administrativo"."severidad_auditoria_enum" NOT NULL DEFAULT 'BAJA',
  "registrado_diferido" BOOLEAN NOT NULL DEFAULT false,
  "id_transaccion" BIGINT NOT NULL DEFAULT txid_current(),
  "detalle" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "bitacora_auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

CREATE TABLE "administrativo"."reportes_periodicos" (
  "id_reporte" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_cohorte" UUID NOT NULL,
  "id_unidad_temporal" UUID NOT NULL,
  "estado" "administrativo"."estado_reporte_enum" NOT NULL DEFAULT 'EN_COLA',
  "clave_almacenamiento" TEXT,
  "mime_type" VARCHAR(100) NOT NULL DEFAULT 'text/csv',
  "tamano_bytes" BIGINT,
  "checksum_sha256" CHAR(64),
  "intentos" INTEGER NOT NULL DEFAULT 0,
  "ultimo_error" VARCHAR(500),
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_generacion" TIMESTAMPTZ(6),
  CONSTRAINT "reportes_periodicos_pkey" PRIMARY KEY ("id_reporte")
);

CREATE TABLE "administrativo"."snapshots_vista" (
  "id_snapshot" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_cohorte" UUID NOT NULL,
  "vista" "administrativo"."vista_agregada_enum" NOT NULL,
  "payload" JSONB NOT NULL,
  "fecha_dato" TIMESTAMPTZ(6) NOT NULL,
  "fecha_captura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "snapshots_vista_pkey" PRIMARY KEY ("id_snapshot")
);

-- 4. INDICES ----------------------------------------------------------
CREATE UNIQUE INDEX "uq_cohorte_nombre_vigente" ON "administrativo"."cohortes"("nombre_cohorte") WHERE (fecha_eliminacion IS NULL);
CREATE INDEX "ix_cohortes_estado" ON "administrativo"."cohortes"("estado") WHERE (fecha_eliminacion IS NULL);
CREATE INDEX "ix_cohortes_cronograma" ON "administrativo"."cohortes"("id_cronograma");

CREATE UNIQUE INDEX "uq_membresia_cohorte_usuario" ON "administrativo"."cohorte_participantes"("id_cohorte", "id_usuario");
CREATE INDEX "ix_membresia_cohorte_estado" ON "administrativo"."cohorte_participantes"("id_cohorte", "estado");
CREATE INDEX "ix_membresia_usuario" ON "administrativo"."cohorte_participantes"("id_usuario");

CREATE INDEX "ix_historial_membresia" ON "administrativo"."cohorte_participantes_historial"("id_cohorte_participante", "fecha_cambio" DESC);

CREATE UNIQUE INDEX "uq_seudonimo_codigo" ON "administrativo"."seudonimos_participante"("codigo_participante");

CREATE UNIQUE INDEX "uq_autorizacion_vigente_cohorte" ON "administrativo"."autorizaciones_transicion_modalidad"("id_cohorte")
  WHERE ((estado_transicion = 'AUTORIZADA'::administrativo.estado_transicion_enum) AND (fecha_consumo IS NULL));
CREATE INDEX "ix_autorizacion_cohorte" ON "administrativo"."autorizaciones_transicion_modalidad"("id_cohorte", "fecha_solicitud" DESC);

CREATE UNIQUE INDEX "uq_permiso_individual_no_revocado" ON "administrativo"."permisos_acceso_individual"("id_usuario_administrativo", "id_participante", "alcance")
  WHERE (revocado_en IS NULL);
CREATE INDEX "ix_permiso_participante" ON "administrativo"."permisos_acceso_individual"("id_participante");

CREATE UNIQUE INDEX "uq_alerta_externo" ON "administrativo"."alertas_gestion_admin"("id_alerta_externo");
CREATE INDEX "ix_alerta_gestion_participante" ON "administrativo"."alertas_gestion_admin"("id_participante", "fecha_atencion" DESC);
CREATE INDEX "ix_alerta_gestion_cohorte" ON "administrativo"."alertas_gestion_admin"("id_cohorte", "fecha_atencion" DESC);

CREATE INDEX "ix_bitacora_fecha" ON "administrativo"."bitacora_auditoria"("marca_temporal" DESC);
CREATE INDEX "ix_bitacora_admin_fecha" ON "administrativo"."bitacora_auditoria"("id_usuario_administrativo", "marca_temporal" DESC);
CREATE INDEX "ix_bitacora_accion_fecha" ON "administrativo"."bitacora_auditoria"("accion", "marca_temporal" DESC);
CREATE INDEX "ix_bitacora_participante" ON "administrativo"."bitacora_auditoria"("id_participante", "marca_temporal" DESC) WHERE (id_participante IS NOT NULL);
CREATE INDEX "ix_bitacora_no_exitosas" ON "administrativo"."bitacora_auditoria"("marca_temporal") WHERE (estado_accion <> 'EXITOSA'::administrativo.estado_accion_enum);
CREATE INDEX "ix_bitacora_tx_recurso" ON "administrativo"."bitacora_auditoria"("id_transaccion", "id_recurso");

CREATE UNIQUE INDEX "uq_reporte_cohorte_unidad" ON "administrativo"."reportes_periodicos"("id_cohorte", "id_unidad_temporal");
CREATE UNIQUE INDEX "uq_reporte_clave" ON "administrativo"."reportes_periodicos"("clave_almacenamiento") WHERE (clave_almacenamiento IS NOT NULL);
CREATE INDEX "ix_reportes_pendientes" ON "administrativo"."reportes_periodicos"("estado") WHERE (estado <> 'GENERADO'::administrativo.estado_reporte_enum);

CREATE UNIQUE INDEX "uq_snapshot_cohorte_vista" ON "administrativo"."snapshots_vista"("id_cohorte", "vista");

-- 5. FOREIGN KEYS -----------------------------------------------------
ALTER TABLE "administrativo"."cohortes"
  ADD CONSTRAINT "fk_cohorte_cronograma" FOREIGN KEY ("id_cronograma") REFERENCES "cronograma"."cronogramas"("id_cronograma") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_cohorte_creado_por" FOREIGN KEY ("creado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_cohorte_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."cohorte_participantes"
  ADD CONSTRAINT "fk_membresia_cohorte" FOREIGN KEY ("id_cohorte") REFERENCES "administrativo"."cohortes"("id_cohorte") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_membresia_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_membresia_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."cohorte_participantes_historial"
  ADD CONSTRAINT "fk_historial_membresia" FOREIGN KEY ("id_cohorte_participante") REFERENCES "administrativo"."cohorte_participantes"("id_cohorte_participante") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_historial_membresia_admin" FOREIGN KEY ("id_usuario_administrativo") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."seudonimos_participante"
  ADD CONSTRAINT "fk_seudonimo_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."autorizaciones_transicion_modalidad"
  ADD CONSTRAINT "fk_autorizacion_cohorte" FOREIGN KEY ("id_cohorte") REFERENCES "administrativo"."cohortes"("id_cohorte") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_autorizacion_admin" FOREIGN KEY ("id_usuario_administrativo") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."permisos_acceso_individual"
  ADD CONSTRAINT "fk_permiso_admin" FOREIGN KEY ("id_usuario_administrativo") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_permiso_participante" FOREIGN KEY ("id_participante") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_permiso_otorgante" FOREIGN KEY ("otorgado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."alertas_gestion_admin"
  ADD CONSTRAINT "fk_alerta_gestion_cohorte" FOREIGN KEY ("id_cohorte") REFERENCES "administrativo"."cohortes"("id_cohorte") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_alerta_gestion_usuario" FOREIGN KEY ("atendida_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."bitacora_auditoria"
  ADD CONSTRAINT "fk_bitacora_admin" FOREIGN KEY ("id_usuario_administrativo") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."reportes_periodicos"
  ADD CONSTRAINT "fk_reporte_cohorte" FOREIGN KEY ("id_cohorte") REFERENCES "administrativo"."cohortes"("id_cohorte") ON DELETE RESTRICT ON UPDATE NO ACTION,
  ADD CONSTRAINT "fk_reporte_unidad" FOREIGN KEY ("id_unidad_temporal") REFERENCES "cronograma"."unidades_temporales"("id_unidad_temporal") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "administrativo"."snapshots_vista"
  ADD CONSTRAINT "fk_snapshot_cohorte" FOREIGN KEY ("id_cohorte") REFERENCES "administrativo"."cohortes"("id_cohorte") ON DELETE CASCADE ON UPDATE NO ACTION;

-- 6. CHECKS -----------------------------------------------------------
ALTER TABLE "administrativo"."cohortes"
  ADD CONSTRAINT "ck_cohorte_nombre" CHECK (btrim(nombre_cohorte) <> ''),
  ADD CONSTRAINT "ck_cohorte_fechas" CHECK (fecha_fin_programa >= fecha_inicio_programa),
  ADD CONSTRAINT "ck_cohorte_activacion" CHECK (estado <> 'ACTIVA' OR fecha_activacion IS NOT NULL);

ALTER TABLE "administrativo"."autorizaciones_transicion_modalidad"
  ADD CONSTRAINT "ck_autorizacion_modalidades" CHECK (modalidad_origen = 'GRUPAL' AND modalidad_destino = 'PERSONALIZADA'),
  ADD CONSTRAINT "ck_autorizacion_fecha" CHECK ((estado_transicion = 'AUTORIZADA') = (fecha_autorizacion IS NOT NULL)),
  ADD CONSTRAINT "ck_autorizacion_conteos" CHECK (total_participantes_evaluados >= 0
        AND total_perfiles_incompletos >= 0 AND total_perfiles_incompletos <= total_participantes_evaluados);

ALTER TABLE "administrativo"."permisos_acceso_individual"
  ADD CONSTRAINT "ck_permiso_vigencia" CHECK (fecha_fin_vigencia IS NULL OR fecha_fin_vigencia > fecha_inicio_vigencia);

ALTER TABLE "administrativo"."bitacora_auditoria"
  ADD CONSTRAINT "ck_bitacora_detalle" CHECK (jsonb_typeof(detalle) = 'object'),
  ADD CONSTRAINT "ck_bitacora_ip" CHECK (btrim(direccion_ip) <> '');

ALTER TABLE "administrativo"."snapshots_vista"
  ADD CONSTRAINT "ck_snapshot_payload" CHECK (jsonb_typeof(payload) = 'object');

ALTER TABLE "administrativo"."reportes_periodicos"
  ADD CONSTRAINT "ck_reporte_tamano" CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0),
  ADD CONSTRAINT "ck_reporte_intentos" CHECK (intentos >= 0),
  ADD CONSTRAINT "ck_reporte_clave" CHECK ((estado = 'GENERADO') = (clave_almacenamiento IS NOT NULL));

-- 7. FUNCIONES UTILITARIAS --------------------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_tocar_fecha_actualizacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.fecha_actualizacion := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION administrativo.fn_bloquear_mutacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'REGISTRO_INMUTABLE' USING ERRCODE = 'AD403',
    DETAIL = format('%s sobre %s.%s no permitido', TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME);
END $$;

-- Valida que las columnas indicadas (pares columna, rol) apunten a usuarios con ese rol.
-- Nota: NO se aplica a la bitacora, porque RF-122 exige registrar intentos de un ESTUDIANTE.
CREATE OR REPLACE FUNCTION administrativo.fn_exigir_rol() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  i int := 0;
  v_id uuid;
  v_rol usuario.rol_enum;
BEGIN
  WHILE i < TG_NARGS LOOP
    v_id := (to_jsonb(NEW) ->> TG_ARGV[i])::uuid;
    IF v_id IS NOT NULL THEN
      SELECT u.rol INTO v_rol FROM usuario.usuarios u WHERE u.id_usuario = v_id;
      IF NOT FOUND OR v_rol::text <> TG_ARGV[i + 1] THEN
        RAISE EXCEPTION 'ROL_INVALIDO' USING ERRCODE = 'AD422',
          DETAIL = format('columna=%s rol_esperado=%s', TG_ARGV[i], TG_ARGV[i + 1]);
      END IF;
    END IF;
    i := i + 2;
  END LOOP;
  RETURN NEW;
END $$;

-- 8. SEUDONIMO (B3) ---------------------------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_obtener_codigo_participante(p_id_usuario uuid)
RETURNS varchar LANGUAGE plpgsql AS $$
DECLARE v_codigo varchar;
BEGIN
  SELECT s.codigo_participante INTO v_codigo
    FROM administrativo.seudonimos_participante s WHERE s.id_usuario = p_id_usuario;
  IF FOUND THEN RETURN v_codigo; END IF;
  LOOP
    v_codigo := 'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO administrativo.seudonimos_participante (id_usuario, codigo_participante)
      VALUES (p_id_usuario, v_codigo);
      RETURN v_codigo;
    EXCEPTION WHEN unique_violation THEN
      SELECT s.codigo_participante INTO v_codigo
        FROM administrativo.seudonimos_participante s WHERE s.id_usuario = p_id_usuario;
      IF FOUND THEN RETURN v_codigo; END IF;   -- lo creo otro proceso; si no, hubo colision de codigo: reintenta
    END;
  END LOOP;
END $$;

-- 9. EVALUACION PEREZOSA DE REQUISITOS (RF-125): se deriva, no se guarda
CREATE OR REPLACE FUNCTION administrativo.fn_estado_validacion_participante(p_id_usuario uuid)
RETURNS TABLE (estado_registro text, estado_consentimiento text, estado_linea_base text, cumple boolean)
LANGUAGE sql STABLE AS $$
  SELECT
    CASE u.estado_registro WHEN 'REGISTRO_COMPLETO' THEN 'COMPLETO'
                           WHEN 'PENDIENTE_REVISION' THEN 'INCOMPLETO'
                           ELSE 'PENDIENTE' END,
    CASE u.consentimiento_aceptado WHEN TRUE THEN 'ACEPTADO'
                                   WHEN FALSE THEN 'NO_ACEPTADO'
                                   ELSE 'PENDIENTE' END,
    CASE WHEN lb.id_linea_base IS NOT NULL THEN 'REGISTRADA'
         WHEN u.consentimiento_aceptado IS TRUE THEN 'NO_REGISTRADA'
         ELSE 'PENDIENTE' END,
    (u.estado_registro = 'REGISTRO_COMPLETO' AND u.consentimiento_aceptado IS TRUE AND lb.id_linea_base IS NOT NULL)
  FROM usuario.usuarios u
  LEFT JOIN usuario.linea_base lb ON lb.id_usuario = u.id_usuario
  WHERE u.id_usuario = p_id_usuario
$$;

-- 10. COHORTES (RF-124) -----------------------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_cohortes_reglas() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_validar boolean;
  v_estado_cron cronograma.estado_cronograma_enum;
BEGIN
  v_validar := (TG_OP = 'INSERT');
  IF TG_OP = 'UPDATE' THEN
    IF NEW.estado <> OLD.estado AND NOT (
         (OLD.estado = 'BORRADOR' AND NEW.estado = 'ACTIVA') OR
         (OLD.estado = 'ACTIVA'   AND NEW.estado = 'INACTIVA') OR
         (OLD.estado = 'INACTIVA' AND NEW.estado = 'ACTIVA')) THEN
      RAISE EXCEPTION 'TRANSICION_COHORTE_INVALIDA' USING ERRCODE = 'AD409',
        DETAIL = format('%s -> %s', OLD.estado, NEW.estado);
    END IF;
    v_validar := NEW.id_cronograma <> OLD.id_cronograma
              OR (NEW.estado = 'ACTIVA' AND OLD.estado <> 'ACTIVA');
  END IF;

  IF v_validar THEN
    SELECT c.estado INTO v_estado_cron FROM cronograma.cronogramas c WHERE c.id_cronograma = NEW.id_cronograma;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRONOGRAMA_NO_ENCONTRADO' USING ERRCODE = 'AD404';
    ELSIF v_estado_cron <> 'ACTIVO' THEN
      RAISE EXCEPTION 'CRONOGRAMA_NO_ACTIVO' USING ERRCODE = 'AD422';
    END IF;
  END IF;

  IF NEW.estado = 'ACTIVA' AND (TG_OP = 'INSERT' OR OLD.estado <> 'ACTIVA') THEN
    NEW.fecha_activacion := now();
    NEW.fecha_inactivacion := NULL;
  ELSIF NEW.estado = 'INACTIVA' AND (TG_OP = 'INSERT' OR OLD.estado <> 'INACTIVA') THEN
    NEW.fecha_inactivacion := now();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cohortes_reglas BEFORE INSERT OR UPDATE ON administrativo.cohortes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_cohortes_reglas();
CREATE TRIGGER trg_cohortes_fecha BEFORE UPDATE ON administrativo.cohortes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_tocar_fecha_actualizacion();
CREATE TRIGGER trg_cohortes_rol BEFORE INSERT OR UPDATE ON administrativo.cohortes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol('creado_por', 'ADMINISTRATIVO', 'actualizado_por', 'ADMINISTRATIVO');

-- 11. MEMBRESIAS (RF-125, B7) -----------------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_membresia_reglas() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_rol usuario.rol_enum;
  v_estado_cohorte administrativo.estado_cohorte_enum;
  v_activando boolean;
  v_cumple boolean;
BEGIN
  SELECT u.rol INTO v_rol FROM usuario.usuarios u WHERE u.id_usuario = NEW.id_usuario;
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ENCONTRADO' USING ERRCODE = 'AD404'; END IF;
  IF v_rol <> 'ESTUDIANTE' THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ES_ESTUDIANTE' USING ERRCODE = 'AD422'; END IF;

  SELECT c.estado INTO v_estado_cohorte FROM administrativo.cohortes c
   WHERE c.id_cohorte = NEW.id_cohorte AND c.fecha_eliminacion IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'COHORTE_NO_ENCONTRADA' USING ERRCODE = 'AD404'; END IF;

  v_activando := (NEW.estado = 'ACTIVO');
  IF TG_OP = 'UPDATE' THEN v_activando := v_activando AND OLD.estado <> 'ACTIVO'; END IF;

  IF TG_OP = 'INSERT' OR v_activando THEN
    IF v_estado_cohorte <> 'ACTIVA' THEN RAISE EXCEPTION 'COHORTE_NO_ACTIVA' USING ERRCODE = 'AD422'; END IF;
  END IF;

  IF v_activando THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.id_usuario::text, 0));   -- serializa por participante
    SELECT v.cumple INTO v_cumple FROM administrativo.fn_estado_validacion_participante(NEW.id_usuario) v;
    IF NOT COALESCE(v_cumple, false) THEN
      RAISE EXCEPTION 'PARTICIPANTE_NO_CUMPLE_REQUISITOS' USING ERRCODE = 'AD422';
    END IF;
    IF EXISTS (SELECT 1 FROM administrativo.cohorte_participantes cp
                 JOIN administrativo.cohortes c ON c.id_cohorte = cp.id_cohorte
                WHERE cp.id_usuario = NEW.id_usuario AND cp.estado = 'ACTIVO' AND c.estado = 'ACTIVA'
                  AND cp.id_cohorte_participante <> NEW.id_cohorte_participante) THEN
      RAISE EXCEPTION 'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA' USING ERRCODE = 'AD409';
    END IF;
  END IF;

  IF NEW.estado = 'INACTIVO' THEN
    NEW.fecha_retiro := COALESCE(NEW.fecha_retiro, now());
  ELSE
    NEW.fecha_retiro := NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM administrativo.fn_obtener_codigo_participante(NEW.id_usuario);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_membresia_reglas BEFORE INSERT OR UPDATE ON administrativo.cohorte_participantes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_membresia_reglas();
CREATE TRIGGER trg_membresia_fecha BEFORE UPDATE ON administrativo.cohorte_participantes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_tocar_fecha_actualizacion();
CREATE TRIGGER trg_membresia_rol BEFORE INSERT OR UPDATE ON administrativo.cohorte_participantes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol('actualizado_por', 'ADMINISTRATIVO');

CREATE OR REPLACE FUNCTION administrativo.fn_membresia_historial() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO administrativo.cohorte_participantes_historial
      (id_cohorte_participante, estado_anterior, estado_nuevo, id_usuario_administrativo)
    VALUES (NEW.id_cohorte_participante, NULL, NEW.estado, NEW.actualizado_por);
  ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO administrativo.cohorte_participantes_historial
      (id_cohorte_participante, estado_anterior, estado_nuevo, id_usuario_administrativo)
    VALUES (NEW.id_cohorte_participante, OLD.estado, NEW.estado, NEW.actualizado_por);
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_membresia_historial AFTER INSERT OR UPDATE OF estado ON administrativo.cohorte_participantes
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_membresia_historial();
CREATE TRIGGER trg_historial_rol BEFORE INSERT ON administrativo.cohorte_participantes_historial
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol('id_usuario_administrativo', 'ADMINISTRATIVO');
-- El historial bloquea UPDATE pero permite DELETE, para que funcione la supresion en cascada del usuario.
CREATE TRIGGER trg_historial_membresia_no_update BEFORE UPDATE ON administrativo.cohorte_participantes_historial
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_bloquear_mutacion();

-- 12. TRANSICION DE MODALIDAD (RF-127) --------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_evaluar_transicion(p_id_cohorte uuid)
RETURNS TABLE (r_cohorte_existe boolean, r_cohorte_activa boolean, r_total int, r_incompletos int, r_no_grupales int)
LANGUAGE plpgsql STABLE AS $$
DECLARE v_estado administrativo.estado_cohorte_enum;
BEGIN
  SELECT c.estado INTO v_estado FROM administrativo.cohortes c
   WHERE c.id_cohorte = p_id_cohorte AND c.fecha_eliminacion IS NULL;
  r_cohorte_existe := FOUND;
  r_cohorte_activa := (v_estado = 'ACTIVA');

  -- Supuesto: un usuario sin fila vigente en chat.tipo_terapia cuenta como GRUPAL.
  SELECT count(*)::int,
         (count(*) FILTER (WHERE pc.perfil_completo IS NOT TRUE))::int,
         (count(*) FILTER (WHERE tt.modalidad = 'PERSONALIZADA'))::int
    INTO r_total, r_incompletos, r_no_grupales
    FROM administrativo.cohorte_participantes cp
    LEFT JOIN chat.perfil_clinico pc ON pc.id_usuario = cp.id_usuario
    LEFT JOIN chat.tipo_terapia tt ON tt.id_usuario = cp.id_usuario AND tt.fecha_vigencia_hasta IS NULL
   WHERE cp.id_cohorte = p_id_cohorte AND cp.estado = 'ACTIVO';

  RETURN NEXT;
END $$;

-- Defensa en profundidad: ninguna fila AUTORIZADA puede existir si no se cumplen las condiciones.
CREATE OR REPLACE FUNCTION administrativo.fn_autorizacion_validar() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE e record;
BEGIN
  IF NEW.estado_transicion <> 'AUTORIZADA' THEN RETURN NEW; END IF;
  SELECT * INTO e FROM administrativo.fn_evaluar_transicion(NEW.id_cohorte);
  IF NOT e.r_cohorte_existe THEN RAISE EXCEPTION 'COHORTE_NO_ENCONTRADA' USING ERRCODE = 'AD404'; END IF;
  IF NOT e.r_cohorte_activa THEN RAISE EXCEPTION 'COHORTE_NO_ACTIVA' USING ERRCODE = 'AD422'; END IF;
  IF e.r_total = 0 THEN RAISE EXCEPTION 'COHORTE_SIN_PARTICIPANTES_ACTIVOS' USING ERRCODE = 'AD422'; END IF;
  IF e.r_incompletos > 0 THEN RAISE EXCEPTION 'PERFIL_CLINICO_INCOMPLETO' USING ERRCODE = 'AD422'; END IF;
  IF e.r_no_grupales > 0 THEN RAISE EXCEPTION 'MODALIDAD_ACTUAL_NO_GRUPAL' USING ERRCODE = 'AD409'; END IF;
  NEW.fecha_autorizacion := COALESCE(NEW.fecha_autorizacion, now());
  RETURN NEW;
END $$;

CREATE TRIGGER trg_autorizacion_validar BEFORE INSERT ON administrativo.autorizaciones_transicion_modalidad
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_autorizacion_validar();
CREATE TRIGGER trg_autorizacion_rol BEFORE INSERT ON administrativo.autorizaciones_transicion_modalidad
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol('id_usuario_administrativo', 'ADMINISTRATIVO');

-- 13. PERMISOS INDIVIDUALES (B1 provisional) y ALERTAS (RF-147) -------
CREATE TRIGGER trg_permiso_rol BEFORE INSERT OR UPDATE ON administrativo.permisos_acceso_individual
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol(
    'id_usuario_administrativo', 'ADMINISTRATIVO', 'id_participante', 'ESTUDIANTE', 'otorgado_por', 'ADMINISTRATIVO');
CREATE TRIGGER trg_alerta_rol BEFORE INSERT ON administrativo.alertas_gestion_admin
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_exigir_rol('atendida_por', 'ADMINISTRATIVO');

-- 14. REPORTES (RF-150) -----------------------------------------------
CREATE OR REPLACE FUNCTION administrativo.fn_reporte_validar() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM administrativo.cohortes c
                   JOIN cronograma.unidades_temporales u ON u.id_cronograma = c.id_cronograma
                  WHERE c.id_cohorte = NEW.id_cohorte AND u.id_unidad_temporal = NEW.id_unidad_temporal) THEN
    RAISE EXCEPTION 'UNIDAD_NO_PERTENECE_A_COHORTE' USING ERRCODE = 'AD422';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_reporte_validar BEFORE INSERT OR UPDATE OF id_cohorte, id_unidad_temporal
  ON administrativo.reportes_periodicos FOR EACH ROW EXECUTE FUNCTION administrativo.fn_reporte_validar();

-- 15. INMUTABILIDAD (RF-123, RF-147) ----------------------------------
CREATE TRIGGER trg_bitacora_inmutable BEFORE UPDATE OR DELETE ON administrativo.bitacora_auditoria
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_bloquear_mutacion();
CREATE TRIGGER trg_bitacora_no_truncate BEFORE TRUNCATE ON administrativo.bitacora_auditoria
  FOR EACH STATEMENT EXECUTE FUNCTION administrativo.fn_bloquear_mutacion();
CREATE TRIGGER trg_alertas_inmutable BEFORE UPDATE OR DELETE ON administrativo.alertas_gestion_admin
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_bloquear_mutacion();

-- 16. ACID ACCION + BITACORA (RF-147, B2): constraint trigger diferido -
CREATE OR REPLACE FUNCTION administrativo.fn_exigir_bitacora() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_id uuid := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM administrativo.bitacora_auditoria b
                  WHERE b.id_transaccion = txid_current()
                    AND b.id_recurso = v_id
                    AND b.accion = TG_ARGV[1]::administrativo.accion_admin_enum) THEN
    RAISE EXCEPTION 'AUDITORIA_OBLIGATORIA_AUSENTE' USING ERRCODE = 'AD500',
      DETAIL = format('%s.%s id=%s', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_id);
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER trg_alerta_exige_bitacora AFTER INSERT ON administrativo.alertas_gestion_admin
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION administrativo.fn_exigir_bitacora('id_alerta_gestion', 'GESTION_ALERTA');
CREATE CONSTRAINT TRIGGER trg_autorizacion_exige_bitacora AFTER INSERT ON administrativo.autorizaciones_transicion_modalidad
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION administrativo.fn_exigir_bitacora('id_autorizacion', 'AUTORIZACION_TRANSICION');

-- 17. PROCEDIMIENTOS (funciones invocadas por el puerto de NestJS) ------
-- 17.1 Registro de auditoria
CREATE OR REPLACE FUNCTION administrativo.fn_registrar_auditoria(
  p_id_admin uuid,
  p_id_sesion uuid,
  p_accion administrativo.accion_admin_enum,
  p_recurso varchar,
  p_id_recurso uuid,
  p_id_participante uuid,
  p_ip varchar,
  p_estado administrativo.estado_accion_enum,
  p_severidad administrativo.severidad_auditoria_enum DEFAULT 'BAJA',
  p_detalle jsonb DEFAULT '{}'::jsonb,
  p_diferido boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO administrativo.bitacora_auditoria
    (id_usuario_administrativo, id_sesion, accion, recurso_afectado, id_recurso, id_participante,
     direccion_ip, estado_accion, severidad, detalle, registrado_diferido)
  VALUES
    (p_id_admin, p_id_sesion, p_accion, p_recurso, p_id_recurso, p_id_participante,
     p_ip, p_estado, p_severidad, COALESCE(p_detalle, '{}'::jsonb), p_diferido)
  RETURNING id_auditoria INTO v_id;
  RETURN v_id;
END $$;

-- 17.2 Asignar participante a cohorte (RF-125): ACTIVO si cumple; si no, PENDIENTE_VALIDACION con motivos
CREATE OR REPLACE FUNCTION administrativo.fn_asignar_participante(
  p_id_cohorte uuid, p_id_usuario uuid, p_id_admin uuid, p_id_sesion uuid, p_ip varchar
) RETURNS TABLE (r_id_cohorte_participante uuid, r_estado administrativo.estado_participante_cohorte_enum, r_motivos text[])
LANGUAGE plpgsql AS $$
DECLARE
  v record;
  v_motivos text[] := '{}';
  v_estado administrativo.estado_participante_cohorte_enum;
  v_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO v FROM administrativo.fn_estado_validacion_participante(p_id_usuario);
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ENCONTRADO' USING ERRCODE = 'AD404'; END IF;

  IF v.estado_registro <> 'COMPLETO' THEN v_motivos := v_motivos || 'REGISTRO_INCOMPLETO'; END IF;
  IF v.estado_consentimiento <> 'ACEPTADO' THEN v_motivos := v_motivos || 'CONSENTIMIENTO_NO_ACEPTADO'; END IF;
  IF v.estado_linea_base <> 'REGISTRADA' THEN v_motivos := v_motivos || 'LINEA_BASE_NO_REGISTRADA'; END IF;

  v_estado := CASE WHEN cardinality(v_motivos) = 0 THEN 'ACTIVO' ELSE 'PENDIENTE_VALIDACION' END;

  BEGIN
    INSERT INTO administrativo.cohorte_participantes (id_cohorte_participante, id_cohorte, id_usuario, estado, actualizado_por)
    VALUES (v_id, p_id_cohorte, p_id_usuario, v_estado, p_id_admin);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'PARTICIPANTE_YA_ASIGNADO' USING ERRCODE = 'AD409';
  END;

  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'GESTION_PARTICIPANTE_COHORTE', 'cohorte_participante', v_id, p_id_usuario, p_ip,
    'EXITOSA', 'MEDIA', jsonb_build_object('estado', v_estado, 'motivos', to_jsonb(v_motivos)));

  RETURN QUERY SELECT v_id, v_estado, v_motivos;
END $$;

-- 17.3 Autorizar transicion GRUPAL -> PERSONALIZADA (RF-127). Si el perfil esta incompleto
--      NO lanza excepcion: guarda PENDIENTE_VALIDACION (el rollback perderia el registro) y la API responde 422.
CREATE OR REPLACE FUNCTION administrativo.fn_autorizar_transicion(
  p_id_cohorte uuid, p_id_admin uuid, p_id_sesion uuid, p_ip varchar
) RETURNS TABLE (r_id_autorizacion uuid, r_estado_transicion administrativo.estado_transicion_enum,
                 r_total_evaluados int, r_total_incompletos int)
LANGUAGE plpgsql AS $$
DECLARE
  e record;
  v_id uuid := gen_random_uuid();
  v_estado administrativo.estado_transicion_enum;
BEGIN
  SELECT * INTO e FROM administrativo.fn_evaluar_transicion(p_id_cohorte);
  IF NOT e.r_cohorte_existe THEN RAISE EXCEPTION 'COHORTE_NO_ENCONTRADA' USING ERRCODE = 'AD404'; END IF;
  IF NOT e.r_cohorte_activa THEN RAISE EXCEPTION 'COHORTE_NO_ACTIVA' USING ERRCODE = 'AD422'; END IF;
  IF e.r_total = 0 THEN RAISE EXCEPTION 'COHORTE_SIN_PARTICIPANTES_ACTIVOS' USING ERRCODE = 'AD422'; END IF;
  IF e.r_no_grupales > 0 THEN RAISE EXCEPTION 'MODALIDAD_ACTUAL_NO_GRUPAL' USING ERRCODE = 'AD409'; END IF;
  IF EXISTS (SELECT 1 FROM administrativo.autorizaciones_transicion_modalidad a
              WHERE a.id_cohorte = p_id_cohorte AND a.estado_transicion = 'AUTORIZADA' AND a.fecha_consumo IS NULL) THEN
    RAISE EXCEPTION 'AUTORIZACION_VIGENTE_EXISTENTE' USING ERRCODE = 'AD409';
  END IF;

  v_estado := CASE WHEN e.r_incompletos = 0 THEN 'AUTORIZADA' ELSE 'PENDIENTE_VALIDACION' END;

  INSERT INTO administrativo.autorizaciones_transicion_modalidad
    (id_autorizacion, id_cohorte, estado_transicion, total_participantes_evaluados,
     total_perfiles_incompletos, id_usuario_administrativo)
  VALUES (v_id, p_id_cohorte, v_estado, e.r_total, e.r_incompletos, p_id_admin);

  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'AUTORIZACION_TRANSICION', 'cohorte', v_id, NULL, p_ip,
    CASE WHEN v_estado = 'AUTORIZADA' THEN 'EXITOSA' ELSE 'DENEGADA' END, 'ALTA',
    jsonb_build_object('id_cohorte', p_id_cohorte, 'estado_transicion', v_estado,
                       'total_evaluados', e.r_total, 'total_incompletos', e.r_incompletos));

  RETURN QUERY SELECT v_id, v_estado, e.r_total, e.r_incompletos;
END $$;

-- 17.4 Marcar alerta como atendida (RF-147): alerta + bitacora en la misma transaccion
CREATE OR REPLACE FUNCTION administrativo.fn_atender_alerta(
  p_id_alerta_externo uuid, p_tipo_alerta administrativo.tipo_alerta_enum, p_id_participante uuid,
  p_id_cohorte uuid, p_id_admin uuid, p_id_sesion uuid, p_ip varchar
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO administrativo.alertas_gestion_admin
      (id_alerta_gestion, id_alerta_externo, tipo_alerta, id_participante, id_cohorte, atendida_por)
    VALUES (v_id, p_id_alerta_externo, p_tipo_alerta, p_id_participante, p_id_cohorte, p_id_admin);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'ALERTA_YA_ATENDIDA' USING ERRCODE = 'AD409';
  END;

  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'GESTION_ALERTA', 'alerta', v_id, p_id_participante, p_ip,
    'EXITOSA', 'MEDIA',
    jsonb_build_object('id_alerta_externo', p_id_alerta_externo, 'tipo_alerta', p_tipo_alerta, 'accion', 'MARCAR_ATENDIDA'));

  RETURN v_id;
END $$;

-- 18. VISTAS ----------------------------------------------------------
CREATE OR REPLACE VIEW administrativo.v_cohorte_participantes_validacion
WITH (security_invoker = true) AS
SELECT cp.id_cohorte,
       cp.id_cohorte_participante,
       s.codigo_participante,
       cp.estado,
       v.estado_registro,
       v.estado_consentimiento,
       v.estado_linea_base,
       v.cumple
  FROM administrativo.cohorte_participantes cp
  JOIN administrativo.seudonimos_participante s ON s.id_usuario = cp.id_usuario
 CROSS JOIN LATERAL administrativo.fn_estado_validacion_participante(cp.id_usuario) v;

CREATE OR REPLACE VIEW administrativo.v_cohortes_resumen
WITH (security_invoker = true) AS
SELECT c.id_cohorte,
       c.nombre_cohorte,
       c.estado,
       c.fecha_inicio_programa,
       c.fecha_fin_programa,
       c.id_cronograma,
       (count(cp.id_cohorte_participante) FILTER (WHERE cp.estado = 'ACTIVO'))::int AS total_activos,
       (count(cp.id_cohorte_participante) FILTER (WHERE cp.estado = 'PENDIENTE_VALIDACION'))::int AS total_pendientes,
       (count(cp.id_cohorte_participante) FILTER (WHERE cp.estado = 'INACTIVO'))::int AS total_inactivos
  FROM administrativo.cohortes c
  LEFT JOIN administrativo.cohorte_participantes cp ON cp.id_cohorte = c.id_cohorte
 WHERE c.fecha_eliminacion IS NULL
 GROUP BY c.id_cohorte;

-- Unidades temporales ya cerradas sin reporte (insumo del job de RF-150, evaluacion perezosa).
-- Supuesto: una unidad esta cerrada cuando fecha_fin < hoy en America/Bogota.
CREATE OR REPLACE VIEW administrativo.v_unidades_cerradas_sin_reporte
WITH (security_invoker = true) AS
SELECT c.id_cohorte, u.id_unidad_temporal, u.orden_unidad, u.fecha_fin
  FROM administrativo.cohortes c
  JOIN cronograma.unidades_temporales u ON u.id_cronograma = c.id_cronograma
  LEFT JOIN administrativo.reportes_periodicos r
         ON r.id_cohorte = c.id_cohorte AND r.id_unidad_temporal = u.id_unidad_temporal
 WHERE c.estado = 'ACTIVA'
   AND c.fecha_eliminacion IS NULL
   AND u.fecha_fin < (now() AT TIME ZONE 'America/Bogota')::date
   AND r.id_reporte IS NULL;

-- 19. CAMBIOS EN OTROS ESQUEMAS ---------------------------------------
-- 19.1 cronograma: un cronograma no puede dejar de estar ACTIVO mientras una cohorte ACTIVA lo use
--      (nota de integridad de RF-124). Afecta a M-4: debe mapear CRONOGRAMA_CON_COHORTE_ACTIVA a 409.
CREATE OR REPLACE FUNCTION administrativo.fn_proteger_cronograma_con_cohorte_activa() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado = 'ACTIVO' AND NEW.estado <> 'ACTIVO' AND EXISTS (
       SELECT 1 FROM administrativo.cohortes c
        WHERE c.id_cronograma = OLD.id_cronograma AND c.estado = 'ACTIVA' AND c.fecha_eliminacion IS NULL) THEN
    RAISE EXCEPTION 'CRONOGRAMA_CON_COHORTE_ACTIVA' USING ERRCODE = 'AD409';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cronogramas_protege_cohorte BEFORE UPDATE OF estado ON cronograma.cronogramas
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_proteger_cronograma_con_cohorte_activa();

-- 20. PERMISOS --------------------------------------------------------
DO $$
DECLARE r text;
BEGIN
  -- Rol del backend: privilegios minimos
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dev_backend') THEN
    GRANT USAGE ON SCHEMA administrativo TO dev_backend;
    GRANT SELECT, INSERT, UPDATE ON administrativo.cohortes, administrativo.cohorte_participantes,
          administrativo.permisos_acceso_individual, administrativo.reportes_periodicos,
          administrativo.snapshots_vista TO dev_backend;
    GRANT SELECT, INSERT ON administrativo.bitacora_auditoria, administrativo.alertas_gestion_admin,
          administrativo.cohorte_participantes_historial, administrativo.autorizaciones_transicion_modalidad,
          administrativo.seudonimos_participante TO dev_backend;
    GRANT UPDATE (fecha_consumo) ON administrativo.autorizaciones_transicion_modalidad TO dev_backend; -- lo usa M-3 (RF-25B)
    GRANT SELECT ON administrativo.v_cohorte_participantes_validacion, administrativo.v_cohortes_resumen,
          administrativo.v_unidades_cerradas_sin_reporte TO dev_backend;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA administrativo TO dev_backend;
    -- Lectura de los otros esquemas que usan las funciones y vistas de M-8
    GRANT USAGE ON SCHEMA usuario, chat, cronograma TO dev_backend;
    GRANT SELECT ON usuario.usuarios, usuario.linea_base, chat.perfil_clinico, chat.tipo_terapia,
          cronograma.cronogramas, cronograma.unidades_temporales TO dev_backend;
  END IF;

  -- El esquema administrativo no se expone por la API de Supabase
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA administrativo FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA administrativo FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA administrativo FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA administrativo FROM %I', r);
    END IF;
  END LOOP;
END $$;

