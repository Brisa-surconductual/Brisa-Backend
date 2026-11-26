BEGIN;

CREATE VIEW chat.v_perfil_clinico_vigente
WITH (security_invoker = true) AS
SELECT
    u.id_usuario,
    COALESCE(p.tipo_dependencia::text, 'PENDIENTE_PERFIL') AS tipo_dependencia,
    COALESCE(p.tipo_craving::text, 'PENDIENTE_PERFIL') AS tipo_craving,
    t.modalidad::text AS modalidad_terapeutica_activa,
    CASE
        WHEN p.perfil_completo THEN 'ACTIVO'
        WHEN s.tiene_sesion_activa OR p.tipo_dependencia IS NOT NULL
            OR p.tipo_craving IS NOT NULL THEN 'PENDIENTE'
        ELSE 'NO_CLASIFICADO'
    END AS estado_perfil_clinico,
    CASE WHEN p.tipo_dependencia IS NOT NULL OR p.tipo_craving IS NOT NULL
        THEN p.fecha_actualizacion
    END AS fecha_clasificacion,
    'CHAT'::text AS fuente_clasificacion
FROM usuario.usuarios u
JOIN LATERAL (
    SELECT bool_or(e.estado_actual = 'ACTIVA') AS tiene_sesion_activa
    FROM chat.sesiones c
    JOIN chat.estado_sesiones e ON e.id_sesion = c.id_sesion
    WHERE c.id_usuario = u.id_usuario
      AND e.estado_actual IN ('ACTIVA', 'COMPLETADA')
    HAVING count(*) > 0
) s ON true
LEFT JOIN chat.perfil_clinico p ON p.id_usuario = u.id_usuario
LEFT JOIN chat.tipo_terapia t ON t.id_usuario = u.id_usuario
    AND t.fecha_vigencia_hasta IS NULL
WHERE u.rol = 'ESTUDIANTE' AND u.estado_registro = 'REGISTRO_COMPLETO';

REVOKE ALL ON chat.v_perfil_clinico_vigente FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON chat.v_perfil_clinico_vigente FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON chat.v_perfil_clinico_vigente FROM authenticated;
    END IF;
END;
$$;

COMMIT;
