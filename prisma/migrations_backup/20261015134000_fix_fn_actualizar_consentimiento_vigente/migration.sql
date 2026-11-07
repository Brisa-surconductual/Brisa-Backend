CREATE OR REPLACE FUNCTION usuario.fn_actualizar_consentimiento_vigente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vigente = TRUE THEN


UPDATE usuario.usuarios
SET estado_registro = 'PENDIENTE_CONSENTIMIENTO'
WHERE id_consentimiento IN (
    SELECT id_consentimiento
    FROM usuario.consentimientos
    WHERE vigente = TRUE
      AND id_consentimiento IS DISTINCT FROM NEW.id_consentimiento
    )
    AND estado_registro = 'REGISTRO_COMPLETO';

UPDATE usuario.consentimientos
SET vigente = FALSE
WHERE vigente = TRUE
  AND id_consentimiento IS DISTINCT FROM NEW.id_consentimiento;

END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_solo_un_consentimiento_vigente ON usuario.consentimientos;

CREATE TRIGGER trg_solo_un_consentimiento_vigente
    BEFORE INSERT OR UPDATE OF vigente ON usuario.consentimientos
    FOR EACH ROW
    EXECUTE FUNCTION usuario.fn_actualizar_consentimiento_vigente();