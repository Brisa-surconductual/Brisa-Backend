-- RF-125: evaluación reutilizada por la asignación y la consulta de la membresía.
CREATE FUNCTION administrativo.fn_motivos_pendiente_participante(
  p_registro text, p_consentimiento text, p_linea_base text
) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN p_registro <> 'COMPLETO' THEN 'REGISTRO_INCOMPLETO' END,
    CASE WHEN p_consentimiento <> 'ACEPTADO' THEN 'CONSENTIMIENTO_NO_ACEPTADO' END,
    CASE WHEN p_linea_base <> 'REGISTRADA' THEN 'LINEA_BASE_NO_REGISTRADA' END
  ], NULL)
$$;

CREATE FUNCTION administrativo.fn_membresia_en_otra_cohorte_activa(
  p_id_cohorte uuid, p_id_usuario uuid
) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM administrativo.cohorte_participantes cp
    JOIN administrativo.cohortes c ON c.id_cohorte = cp.id_cohorte
    WHERE cp.id_usuario = p_id_usuario AND cp.id_cohorte <> p_id_cohorte
      AND cp.estado <> 'INACTIVO' AND c.estado = 'ACTIVA'
      AND c.fecha_eliminacion IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION administrativo.fn_asignar_participante(
  p_id_cohorte uuid, p_id_usuario uuid, p_id_admin uuid, p_id_sesion uuid, p_ip varchar
) RETURNS TABLE (r_id_cohorte_participante uuid, r_estado administrativo.estado_participante_cohorte_enum, r_motivos text[])
LANGUAGE plpgsql AS $$
DECLARE
  v_validacion record;
  v_motivos text[];
  v_estado administrativo.estado_participante_cohorte_enum;
  v_estado_cohorte administrativo.estado_cohorte_enum;
  v_id uuid;
BEGIN
  SELECT c.estado INTO v_estado_cohorte FROM administrativo.cohortes c
  WHERE c.id_cohorte = p_id_cohorte AND c.fecha_eliminacion IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'COHORTE_NO_ENCONTRADA' USING ERRCODE = 'AD404'; END IF;
  IF v_estado_cohorte <> 'ACTIVA' THEN RAISE EXCEPTION 'COHORTE_NO_ACTIVA' USING ERRCODE = 'AD422'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_id_usuario::text, 0));
  IF EXISTS (
    SELECT 1 FROM administrativo.cohorte_participantes cp
    WHERE cp.id_cohorte = p_id_cohorte AND cp.id_usuario = p_id_usuario AND cp.estado <> 'INACTIVO'
  ) THEN
    RAISE EXCEPTION 'PARTICIPANTE_YA_ASIGNADO' USING ERRCODE = 'AD409';
  END IF;
  IF administrativo.fn_membresia_en_otra_cohorte_activa(p_id_cohorte, p_id_usuario) THEN
    RAISE EXCEPTION 'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA' USING ERRCODE = 'AD409';
  END IF;

  SELECT * INTO v_validacion FROM administrativo.fn_estado_validacion_participante(p_id_usuario);
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ENCONTRADO' USING ERRCODE = 'AD404'; END IF;
  v_motivos := administrativo.fn_motivos_pendiente_participante(
    v_validacion.estado_registro, v_validacion.estado_consentimiento, v_validacion.estado_linea_base
  );
  v_estado := CASE WHEN v_validacion.cumple THEN 'ACTIVO' ELSE 'PENDIENTE_VALIDACION' END;

  INSERT INTO administrativo.cohorte_participantes AS cp (id_cohorte, id_usuario, estado, actualizado_por)
  VALUES (p_id_cohorte, p_id_usuario, v_estado, p_id_admin)
  ON CONFLICT (id_cohorte, id_usuario) DO UPDATE SET
    estado = EXCLUDED.estado, actualizado_por = EXCLUDED.actualizado_por, fecha_asignacion = now()
  WHERE cp.estado = 'INACTIVO'
  RETURNING cp.id_cohorte_participante INTO v_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_YA_ASIGNADO' USING ERRCODE = 'AD409'; END IF;

  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'GESTION_PARTICIPANTE_COHORTE', 'cohorte_participante', v_id, p_id_usuario, p_ip,
    'EXITOSA', 'MEDIA', jsonb_build_object('operacion', 'ASIGNAR', 'estado', v_estado, 'motivos', to_jsonb(v_motivos)));
  RETURN QUERY SELECT v_id, v_estado, v_motivos;
END $$;

CREATE FUNCTION administrativo.fn_retirar_participante(
  p_id_cohorte uuid, p_codigo varchar, p_id_admin uuid, p_id_sesion uuid, p_ip varchar
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
  v_usuario uuid;
BEGIN
  SELECT s.id_usuario INTO v_usuario FROM administrativo.seudonimos_participante s WHERE s.codigo_participante = p_codigo;
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ASIGNADO' USING ERRCODE = 'AD404'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_usuario::text, 0));
  UPDATE administrativo.cohorte_participantes cp
  SET estado = 'INACTIVO', actualizado_por = p_id_admin
  WHERE cp.id_cohorte = p_id_cohorte AND cp.id_usuario = v_usuario AND cp.estado <> 'INACTIVO'
  RETURNING cp.id_cohorte_participante INTO v_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PARTICIPANTE_NO_ASIGNADO' USING ERRCODE = 'AD404'; END IF;

  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'GESTION_PARTICIPANTE_COHORTE', 'cohorte_participante', v_id, v_usuario, p_ip,
    'EXITOSA', 'MEDIA', jsonb_build_object('operacion', 'RETIRAR', 'estado', 'INACTIVO'));
  RETURN v_id;
END $$;

-- Activar una cohorte vuelve vigentes sus membresías no retiradas. Comparte
-- el orden de bloqueo por usuario con la asignación por lote de RF-125.
CREATE FUNCTION administrativo.fn_validar_membresias_al_activar_cohorte()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_usuario uuid;
BEGIN
  FOR v_usuario IN
    SELECT cp.id_usuario FROM administrativo.cohorte_participantes cp
    WHERE cp.id_cohorte = NEW.id_cohorte AND cp.estado <> 'INACTIVO'
    ORDER BY cp.id_usuario
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(v_usuario::text, 0));
    IF administrativo.fn_membresia_en_otra_cohorte_activa(NEW.id_cohorte, v_usuario) THEN
      RAISE EXCEPTION 'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA' USING ERRCODE = 'AD409';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cohortes_validar_membresias_al_activar
  BEFORE UPDATE OF estado ON administrativo.cohortes
  FOR EACH ROW WHEN (NEW.estado = 'ACTIVA' AND OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION administrativo.fn_validar_membresias_al_activar_cohorte();
