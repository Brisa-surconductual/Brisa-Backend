BEGIN;

DROP TRIGGER trg_bitacora_inmutable ON administrativo.bitacora_auditoria;
CREATE TRIGGER trg_bitacora_inmutable BEFORE UPDATE OR DELETE ON administrativo.bitacora_auditoria
  FOR EACH STATEMENT EXECUTE FUNCTION administrativo.fn_bloquear_mutacion();

COMMIT;
