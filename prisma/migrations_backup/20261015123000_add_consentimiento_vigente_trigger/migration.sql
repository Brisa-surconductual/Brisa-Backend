CREATE OR REPLACE FUNCTION usuario.fn_actualizar_consentimiento_vigente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vigente = TRUE THEN
UPDATE usuario.consentimientos
SET vigente = FALSE
WHERE usuario_id = NEW.usuario_id
  AND vigente = TRUE
  AND id IS DISTINCT FROM NEW.id;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Vincular el trigger a la tabla usuario.consentimientos
DROP TRIGGER IF EXISTS trg_solo_un_consentimiento_vigente ON usuario.consentimientos;

CREATE TRIGGER trg_solo_un_consentimiento_vigente
    BEFORE INSERT OR UPDATE OF vigente ON usuario.consentimientos
    FOR EACH ROW
    EXECUTE FUNCTION usuario.fn_actualizar_consentimiento_vigente();