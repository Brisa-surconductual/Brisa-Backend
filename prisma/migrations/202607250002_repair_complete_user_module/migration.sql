-- The previous migration was already recorded in some databases before its
-- final statements were added. Reapply the complete, idempotent structure in a
-- new migration so Prisma's migration history and the real schema converge.

-- RF-01 creates only credentials; consent is linked later in RF-05.
ALTER TABLE "usuario"."usuarios"
ALTER COLUMN "id_consentimiento" DROP NOT NULL;

-- The requirements collect age, not a precise date of birth.
ALTER TABLE "usuario"."linea_base"
ADD COLUMN IF NOT EXISTS "edad" INTEGER;

CREATE TABLE IF NOT EXISTS "usuario"."aceptaciones_consentimiento" (
    "id_aceptacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_consentimiento" UUID NOT NULL,
    "tratamiento_datos_aceptado" BOOLEAN NOT NULL,
    "registro_consumo_aceptado" BOOLEAN NOT NULL,
    "fecha_aceptacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "fecha_invalidacion" TIMESTAMPTZ(6),
    "motivo_invalidacion" TEXT,

    CONSTRAINT "aceptaciones_consentimiento_pkey" PRIMARY KEY ("id_aceptacion"),
    CONSTRAINT "fk_aceptacion_usuario"
      FOREIGN KEY ("id_usuario")
      REFERENCES "usuario"."usuarios"("id_usuario")
      ON DELETE CASCADE
      ON UPDATE NO ACTION,
    CONSTRAINT "fk_aceptacion_consentimiento"
      FOREIGN KEY ("id_consentimiento")
      REFERENCES "usuario"."consentimientos"("id_consentimiento")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "ix_aceptacion_usuario_vigente"
ON "usuario"."aceptaciones_consentimiento" ("id_usuario", "vigente");

CREATE INDEX IF NOT EXISTS "ix_aceptacion_consentimiento"
ON "usuario"."aceptaciones_consentimiento" ("id_consentimiento");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_consentimientos_version"
ON "usuario"."consentimientos" ("version_consentimiento");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_recuperacion_codigo_hash"
ON "usuario"."solicitudes_recuperacion" ("codigo_hash");
