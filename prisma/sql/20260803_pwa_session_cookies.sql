-- Migración manual para la base existente restaurada desde Backup.sql.
-- Las sesiones anteriores se invalidan porque sus UUID fueron expuestos como credenciales
-- y no existe el token original necesario para calcular los nuevos hashes.

DO $$
BEGIN
  CREATE TYPE usuario.alcance_sesion_enum AS ENUM ('LIMITADA', 'COMPLETA');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE usuario.sesiones
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS csrf_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS alcance_sesion usuario.alcance_sesion_enum NOT NULL DEFAULT 'LIMITADA';

UPDATE usuario.sesiones
SET
  activa = false,
  fecha_cierre_sesion = COALESCE(fecha_cierre_sesion, NOW()),
  motivo_cierre = COALESCE(motivo_cierre, 'VOLUNTARIO'::usuario.motivo_cierre_enum)
WHERE activa = true
  AND token_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sesiones_token_hash
  ON usuario.sesiones (token_hash);
