-- RF-147: marcar una alerta como atendida exige un motivo.
-- Cada fila de administrativo.alertas_gestion_admin es un cambio de estado de una
-- alerta de M05 (hoy, a ATENDIDA), por eso el motivo es NOT NULL.

-- 1. Columna motivo -------------------------------------------------------------
-- ADD COLUMN con DEFAULT no ejecuta UPDATE, así que no choca con trg_alertas_inmutable.
-- El valor por omisión solo rellena filas previas y se retira enseguida.
ALTER TABLE "administrativo"."alertas_gestion_admin"
  ADD COLUMN "motivo" TEXT NOT NULL DEFAULT 'Registro anterior a la exigencia de motivo (RF-147).';

ALTER TABLE "administrativo"."alertas_gestion_admin"
  ALTER COLUMN "motivo" DROP DEFAULT;

ALTER TABLE "administrativo"."alertas_gestion_admin"
  ADD CONSTRAINT "ck_alerta_motivo" CHECK (char_length(btrim(motivo)) BETWEEN 10 AND 500);

-- 2. Procedimiento de atención -------------------------------------------------
-- La firma anterior no recibía motivo: se elimina para que nadie pueda atender una
-- alerta sin él.
DROP FUNCTION IF EXISTS administrativo.fn_atender_alerta(
  uuid, administrativo.tipo_alerta_enum, uuid, uuid, uuid, uuid, varchar);

-- Alerta + bitácora en la misma transacción (trg_alerta_exige_bitacora lo exige).
CREATE OR REPLACE FUNCTION administrativo.fn_atender_alerta(
  p_id_alerta_externo uuid,
  p_tipo_alerta administrativo.tipo_alerta_enum,
  p_id_participante uuid,
  p_motivo text,
  p_id_admin uuid,
  p_id_sesion uuid,
  p_ip varchar
) RETURNS TABLE (r_id_alerta_gestion uuid, r_fecha_atencion timestamptz)
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_fecha timestamptz;
  v_cohorte uuid;
BEGIN
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'MOTIVO_OBLIGATORIO' USING ERRCODE = 'AD422';
  END IF;

  -- Cohorte activa del participante, si la tiene (solo como contexto del registro).
  SELECT cp.id_cohorte INTO v_cohorte
    FROM administrativo.cohorte_participantes cp
    JOIN administrativo.cohortes c ON c.id_cohorte = cp.id_cohorte
   WHERE cp.id_usuario = p_id_participante AND cp.estado = 'ACTIVO'
     AND c.estado = 'ACTIVA' AND c.fecha_eliminacion IS NULL
   LIMIT 1;

  BEGIN
    INSERT INTO administrativo.alertas_gestion_admin
      (id_alerta_gestion, id_alerta_externo, tipo_alerta, id_participante, id_cohorte,
       atendida_por, motivo)
    VALUES (v_id, p_id_alerta_externo, p_tipo_alerta, p_id_participante, v_cohorte,
       p_id_admin, btrim(p_motivo))
    RETURNING fecha_atencion INTO v_fecha;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'ALERTA_YA_ATENDIDA' USING ERRCODE = 'AD409';
  END;

  -- El texto del motivo no se copia en la bitácora: queda solo en la tabla de gestión.
  PERFORM administrativo.fn_registrar_auditoria(
    p_id_admin, p_id_sesion, 'GESTION_ALERTA', 'ALERTA_PARTICIPANTE', v_id, p_id_participante,
    p_ip, 'EXITOSA', 'ALTA',
    jsonb_build_object('operacion', 'MARCAR_ATENDIDA', 'id_alerta_externo', p_id_alerta_externo,
                       'tipo_alerta', p_tipo_alerta));

  RETURN QUERY SELECT v_id, v_fecha;
END $$;
