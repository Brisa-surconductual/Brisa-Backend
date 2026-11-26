CREATE OR REPLACE FUNCTION usuario.fn_sincronizar_estado_consentimiento()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.estado_registro = 'PENDIENTE_CONSENTIMIENTO' THEN
        NEW.consentimiento_aceptado = FALSE;
END IF;


RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_estado_consentimiento ON usuario.usuarios;

CREATE TRIGGER trg_sincronizar_estado_consentimiento
    BEFORE INSERT OR UPDATE OF estado_registro ON usuario.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION usuario.fn_sincronizar_estado_consentimiento();