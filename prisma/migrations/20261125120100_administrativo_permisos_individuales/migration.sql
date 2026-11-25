-- HU permisos-individuales (RF-04, RF-03, RF-122, RF-123, RF-145).
-- Reutiliza administrativo.permisos_acceso_individual (creada en 20261120154314_modulo_cronograma).
-- Otorgante: COORDINADOR_PSI. Beneficiario: ADMINISTRATIVO. Participante: ESTUDIANTE.

-- 1. COORDINADOR_PSI tiene el mismo alcance que ADMINISTRATIVO ------------------
-- Donde una tabla exige 'ADMINISTRATIVO' (cohortes, membresias, autorizaciones,
-- alertas), tambien se acepta 'COORDINADOR_PSI'. Cualquier otro rol esperado se
-- sigue comparando de forma exacta.
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
      IF NOT FOUND OR NOT (
           v_rol::text = TG_ARGV[i + 1]
           OR (TG_ARGV[i + 1] = 'ADMINISTRATIVO' AND v_rol::text = 'COORDINADOR_PSI')
         ) THEN
        RAISE EXCEPTION 'ROL_INVALIDO' USING ERRCODE = 'AD422',
          DETAIL = format('columna=%s rol_esperado=%s', TG_ARGV[i], TG_ARGV[i + 1]);
      END IF;
    END IF;
    i := i + 2;
  END LOOP;
  RETURN NEW;
END $$;

-- 2. Columnas e indices -------------------------------------------------------
ALTER TABLE "administrativo"."permisos_acceso_individual"
  ADD COLUMN "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ix_permiso_otorgante_fecha"
  ON "administrativo"."permisos_acceso_individual"("otorgado_por", "fecha_creacion" DESC);

CREATE TRIGGER trg_permiso_fecha BEFORE UPDATE ON administrativo.permisos_acceso_individual
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_tocar_fecha_actualizacion();

-- 3. Reglas del permiso ------------------------------------------------------
DROP TRIGGER IF EXISTS trg_permiso_rol ON administrativo.permisos_acceso_individual;

CREATE OR REPLACE FUNCTION administrativo.fn_permiso_individual_reglas() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_rol_beneficiario text;
  v_rol_otorgante text;
  v_rol_participante text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.otorgado_por = NEW.id_usuario_administrativo THEN
      RAISE EXCEPTION 'AUTOCONCESION_NO_PERMITIDA' USING ERRCODE = 'AD422';
    END IF;
    SELECT u.rol::text INTO v_rol_beneficiario FROM usuario.usuarios u WHERE u.id_usuario = NEW.id_usuario_administrativo;
    SELECT u.rol::text INTO v_rol_otorgante FROM usuario.usuarios u WHERE u.id_usuario = NEW.otorgado_por;
    SELECT u.rol::text INTO v_rol_participante FROM usuario.usuarios u WHERE u.id_usuario = NEW.id_participante;
    IF v_rol_beneficiario IS DISTINCT FROM 'ADMINISTRATIVO' THEN
      RAISE EXCEPTION 'ROL_INVALIDO' USING ERRCODE = 'AD422',
        DETAIL = 'columna=id_usuario_administrativo rol_esperado=ADMINISTRATIVO';
    END IF;
    IF v_rol_otorgante IS DISTINCT FROM 'COORDINADOR_PSI' THEN
      RAISE EXCEPTION 'ROL_INVALIDO' USING ERRCODE = 'AD422',
        DETAIL = 'columna=otorgado_por rol_esperado=COORDINADOR_PSI';
    END IF;
    IF v_rol_participante IS DISTINCT FROM 'ESTUDIANTE' THEN
      RAISE EXCEPTION 'ROL_INVALIDO' USING ERRCODE = 'AD422',
        DETAIL = 'columna=id_participante rol_esperado=ESTUDIANTE';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: lo unico que puede cambiar es revocado_en, y solo de NULL a un valor.
  IF OLD.revocado_en IS NOT NULL THEN
    RAISE EXCEPTION 'PERMISO_YA_REVOCADO' USING ERRCODE = 'AD409';
  END IF;
  IF NEW.revocado_en IS NULL
     OR NEW.id_permiso IS DISTINCT FROM OLD.id_permiso
     OR NEW.id_usuario_administrativo IS DISTINCT FROM OLD.id_usuario_administrativo
     OR NEW.id_participante IS DISTINCT FROM OLD.id_participante
     OR NEW.alcance IS DISTINCT FROM OLD.alcance
     OR NEW.fecha_inicio_vigencia IS DISTINCT FROM OLD.fecha_inicio_vigencia
     OR NEW.fecha_fin_vigencia IS DISTINCT FROM OLD.fecha_fin_vigencia
     OR NEW.otorgado_por IS DISTINCT FROM OLD.otorgado_por
     OR NEW.fecha_creacion IS DISTINCT FROM OLD.fecha_creacion THEN
    RAISE EXCEPTION 'REGISTRO_INMUTABLE' USING ERRCODE = 'AD403',
      DETAIL = 'solo se permite registrar la revocacion del permiso';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_permiso_reglas BEFORE INSERT OR UPDATE ON administrativo.permisos_acceso_individual
  FOR EACH ROW EXECUTE FUNCTION administrativo.fn_permiso_individual_reglas();

-- 4. Toda alta o revocacion exige su registro en la bitacora en la misma transaccion
CREATE CONSTRAINT TRIGGER trg_permiso_exige_bitacora AFTER INSERT OR UPDATE ON administrativo.permisos_acceso_individual
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION administrativo.fn_exigir_bitacora('id_permiso', 'GESTION_PERMISO_INDIVIDUAL');

-- 5. Regla de vigencia (unica fuente para el guard y los listados) ------------
CREATE OR REPLACE FUNCTION administrativo.fn_permiso_individual_vigente(
  p_id_admin uuid, p_id_participante uuid, p_alcance administrativo.alcance_permiso_enum
) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM administrativo.permisos_acceso_individual p
    WHERE p.id_usuario_administrativo = p_id_admin
      AND p.id_participante = p_id_participante
      AND p.alcance = p_alcance
      AND p.revocado_en IS NULL
      AND p.fecha_inicio_vigencia <= now()
      AND (p.fecha_fin_vigencia IS NULL OR p.fecha_fin_vigencia > now())
  )
$$;

-- 6. Cierre de permisos vencidos sin revocar ----------------------------------
-- El indice unico parcial uq_permiso_individual_no_revocado considera "abierto" un
-- permiso vencido que nunca se revoco. Antes de otorgar uno nuevo para la misma
-- combinacion se cierra con revocado_en = fecha_fin_vigencia, y cada cierre queda
-- en la bitacora (severidad ALTA) dentro de la misma transaccion.
CREATE OR REPLACE FUNCTION administrativo.fn_cerrar_permisos_vencidos(
  p_id_admin uuid, p_id_participante uuid, p_alcance administrativo.alcance_permiso_enum,
  p_id_actor uuid, p_id_sesion uuid, p_ip varchar
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v record;
  v_total integer := 0;
BEGIN
  FOR v IN
    UPDATE administrativo.permisos_acceso_individual p
       SET revocado_en = p.fecha_fin_vigencia
     WHERE p.id_usuario_administrativo = p_id_admin
       AND p.id_participante = p_id_participante
       AND p.alcance = p_alcance
       AND p.revocado_en IS NULL
       AND p.fecha_fin_vigencia IS NOT NULL
       AND p.fecha_fin_vigencia <= now()
    RETURNING p.id_permiso, p.fecha_fin_vigencia
  LOOP
    PERFORM administrativo.fn_registrar_auditoria(
      p_id_actor, p_id_sesion, 'GESTION_PERMISO_INDIVIDUAL', 'PERMISO_INDIVIDUAL', v.id_permiso,
      p_id_participante, p_ip, 'EXITOSA', 'ALTA',
      jsonb_build_object('operacion', 'CIERRE_POR_VENCIMIENTO', 'fecha_fin_vigencia', v.fecha_fin_vigencia));
    v_total := v_total + 1;
  END LOOP;
  RETURN v_total;
END $$;
