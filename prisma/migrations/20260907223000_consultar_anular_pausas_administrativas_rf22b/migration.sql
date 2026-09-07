-- El estado FINALIZADA depende del instante de consulta. Se deriva en la BD
-- para evitar procesos programados y conservar ANULADA como estado prioritario.
CREATE OR REPLACE FUNCTION cronograma.fn_historial_pausas_administrativas_usuario(
  p_id_usuario uuid,
  p_fecha_consulta timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  id_pausa uuid,
  id_usuario uuid,
  id_cronograma_usuario uuid,
  fecha_inicio_pausa timestamptz,
  fecha_fin_pausa timestamptz,
  motivo_pausa text,
  id_usuario_administrativo uuid,
  fecha_registro timestamptz,
  estado_pausa cronograma.estado_pausa_enum
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, cronograma
AS $$
  SELECT
    pausa.id_pausa,
    pausa.id_usuario,
    pausa.id_cronograma_usuario,
    pausa.fecha_inicio_pausa,
    pausa.fecha_fin_pausa,
    pausa.motivo_pausa,
    pausa.id_usuario_administrativo,
    pausa.fecha_registro,
    CASE
      WHEN pausa.estado_pausa = 'ANULADA'::cronograma.estado_pausa_enum
        THEN 'ANULADA'::cronograma.estado_pausa_enum
      WHEN pausa.estado_pausa = 'FINALIZADA'::cronograma.estado_pausa_enum
        OR pausa.fecha_fin_pausa <= COALESCE(
          p_fecha_consulta,
          CURRENT_TIMESTAMP
        )
        THEN 'FINALIZADA'::cronograma.estado_pausa_enum
      ELSE 'ACTIVA'::cronograma.estado_pausa_enum
    END AS estado_pausa
  FROM cronograma.pausas_administrativas AS pausa
  WHERE pausa.id_usuario = p_id_usuario
  ORDER BY
    pausa.fecha_inicio_pausa DESC,
    pausa.fecha_registro DESC,
    pausa.id_pausa;
$$;

COMMENT ON FUNCTION cronograma.fn_historial_pausas_administrativas_usuario(
  uuid,
  timestamptz
)
IS 'RF-22B: lista el historial de pausas y deriva su estado temporal sin mutar los registros.';
