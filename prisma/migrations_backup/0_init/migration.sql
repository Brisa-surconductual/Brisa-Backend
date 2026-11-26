-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cronograma";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "usuario";

-- CreateEnum
CREATE TYPE "cronograma"."estado_contenido_enum" AS ENUM ('PROGRAMADO', 'ACTIVO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "cronograma"."estado_cronograma_enum" AS ENUM ('INACTIVO', 'ACTIVO');

-- CreateEnum
CREATE TYPE "cronograma"."estado_pausa_enum" AS ENUM ('ACTIVA', 'FINALIZADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "cronograma"."tipo_contenido_enum" AS ENUM ('INFORMATIVO', 'ACTIVIDAD', 'MULTIMEDIA');

-- CreateEnum
CREATE TYPE "cronograma"."tipo_recurso_enum" AS ENUM ('TEXTO', 'IMAGEN', 'VIDEO', 'AUDIO', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "usuario"."alcance_sesion_enum" AS ENUM ('LIMITADA', 'COMPLETA');

-- CreateEnum
CREATE TYPE "usuario"."estado_aplicacion_enum" AS ENUM ('ACTIVA', 'SEGUNDO_PLANO');

-- CreateEnum
CREATE TYPE "usuario"."estado_codigo_enum" AS ENUM ('ACTIVO', 'USADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "usuario"."estado_cuenta_enum" AS ENUM ('PENDIENTE_ACTIVACION', 'ACTIVA', 'BLOQUEADA');

-- CreateEnum
CREATE TYPE "usuario"."estado_registro_enum" AS ENUM ('PENDIENTE_CONSENTIMIENTO', 'PENDIENTE_REVISION', 'REGISTRO_COMPLETO');

-- CreateEnum
CREATE TYPE "usuario"."motivo_cierre_enum" AS ENUM ('VOLUNTARIO', 'INACTIVIDAD', 'SEGUNDO_PLANO');

-- CreateEnum
CREATE TYPE "usuario"."motivo_consumo_enum" AS ENUM ('ESTRES', 'PRESION_SOCIAL', 'CURIOSIDAD', 'ANSIEDAD', 'HABITO', 'OTRO');

-- CreateEnum
CREATE TYPE "usuario"."nivel_academico_enum" AS ENUM ('PREGRADO', 'POSGRADO');

-- CreateEnum
CREATE TYPE "usuario"."rol_enum" AS ENUM ('ESTUDIANTE', 'ADMINISTRATIVO');

-- CreateTable
CREATE TABLE "cronograma"."contenidos" (
    "id_contenido" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_contenido" VARCHAR(255) NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_contenido" "cronograma"."tipo_contenido_enum" NOT NULL,

    CONSTRAINT "contenidos_pkey" PRIMARY KEY ("id_contenido")
);

-- CreateTable
CREATE TABLE "cronograma"."contenidos_cronograma" (
    "id_contenido_cronograma" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_contenido" UUID NOT NULL,
    "id_unidad_temporal" UUID NOT NULL,
    "id_cronograma" UUID NOT NULL,
    "orden_contenido" INTEGER,
    "fecha_inicio_disponibilidad" TIMESTAMPTZ(6),
    "fecha_fin_disponibilidad" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contenidos_cronograma_pkey" PRIMARY KEY ("id_contenido_cronograma")
);

-- CreateTable
CREATE TABLE "cronograma"."cronogramas" (
    "id_cronograma" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_cronograma" VARCHAR(150) NOT NULL,
    "estado" "cronograma"."estado_cronograma_enum" NOT NULL DEFAULT 'INACTIVO',
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "fecha_activacion" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cronogramas_pkey" PRIMARY KEY ("id_cronograma")
);

-- CreateTable
CREATE TABLE "cronograma"."cronogramas_usuario" (
    "id_cronograma_usuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_cronograma" UUID NOT NULL,
    "fecha_inicio_usuario" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cronogramas_usuario_pkey" PRIMARY KEY ("id_cronograma_usuario")
);

-- CreateTable
CREATE TABLE "cronograma"."eventos_contenido" (
    "id_evento" BIGSERIAL NOT NULL,
    "id_contenido_cronograma" UUID NOT NULL,
    "id_cronograma" UUID NOT NULL,
    "estado_anterior" "cronograma"."estado_contenido_enum",
    "estado_nuevo" "cronograma"."estado_contenido_enum" NOT NULL,
    "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_evento" VARCHAR(10) NOT NULL DEFAULT '1.0',
    "payload" JSONB NOT NULL,

    CONSTRAINT "eventos_contenido_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "cronograma"."modulos_sistema" (
    "id_modulo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo_modulo" VARCHAR(10) NOT NULL,
    "nombre_modulo" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modulos_sistema_pkey" PRIMARY KEY ("id_modulo")
);

-- CreateTable
CREATE TABLE "cronograma"."pausas_administrativas" (
    "id_pausa" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_cronograma_usuario" UUID NOT NULL,
    "fecha_inicio_pausa" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin_pausa" TIMESTAMPTZ(6) NOT NULL,
    "motivo_pausa" TEXT NOT NULL,
    "id_usuario_administrativo" UUID NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_pausa" "cronograma"."estado_pausa_enum" NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT "pausas_administrativas_pkey" PRIMARY KEY ("id_pausa")
);

-- CreateTable
CREATE TABLE "cronograma"."recursos_contenido" (
    "id_recurso" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_contenido" UUID NOT NULL,
    "tipo_recurso" "cronograma"."tipo_recurso_enum" NOT NULL,
    "orden_bloque" INTEGER NOT NULL,
    "texto_contenido" TEXT,
    "clave_almacenamiento" TEXT,
    "mime_type" VARCHAR(100),
    "tamano_bytes" BIGINT,
    "duracion_segundos" INTEGER,
    "texto_alternativo" VARCHAR(255),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recursos_contenido_pkey" PRIMARY KEY ("id_recurso")
);

-- CreateTable
CREATE TABLE "cronograma"."recursos_modulos_destino" (
    "id_recurso" UUID NOT NULL,
    "id_modulo" UUID NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recursos_modulos_destino_pkey" PRIMARY KEY ("id_recurso","id_modulo")
);

-- CreateTable
CREATE TABLE "cronograma"."unidades_temporales" (
    "id_unidad_temporal" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cronograma" UUID NOT NULL,
    "nombre_unidad" VARCHAR(150) NOT NULL,
    "orden_unidad" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "utilizada_por_usuarios" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_temporales_pkey" PRIMARY KEY ("id_unidad_temporal")
);

-- CreateTable
CREATE TABLE "usuario"."consentimientos" (
    "id_consentimiento" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_consentimiento" VARCHAR(20) NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "fecha_invalidacion" TIMESTAMPTZ(6),
    "motivo_invalidacion" TEXT,
    "url_contenido" TEXT NOT NULL,
    "titulo" VARCHAR(35) NOT NULL,

    CONSTRAINT "consentimientos_pkey" PRIMARY KEY ("id_consentimiento")
);

-- CreateTable
CREATE TABLE "usuario"."linea_base" (
    "id_linea_base" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "entidad_educativa" VARCHAR(255) NOT NULL,
    "programa_academico" VARCHAR(255) NOT NULL,
    "semestre_cursado" INTEGER NOT NULL,
    "nivel_academico" "usuario"."nivel_academico_enum" NOT NULL,
    "ciudad" VARCHAR(150) NOT NULL,
    "fecha_inicio_consumo" DATE NOT NULL,
    "motivo_inicio_consumo" "usuario"."motivo_consumo_enum" NOT NULL,
    "fecha_ultimo_consumo" DATE NOT NULL,
    "frecuencia_consumo" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_nacimiento" DATE,

    CONSTRAINT "linea_base_pkey" PRIMARY KEY ("id_linea_base")
);

-- CreateTable
CREATE TABLE "usuario"."linea_base_historial" (
    "id_historial" BIGSERIAL NOT NULL,
    "id_linea_base" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "campos_modificados" TEXT[],
    "datos_anteriores" JSONB NOT NULL,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linea_base_historial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "usuario"."sesiones" (
    "id_sesion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "fecha_inicio_sesion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_interaccion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "limite_inactividad_minutos" INTEGER NOT NULL DEFAULT 15,
    "estado_aplicacion" "usuario"."estado_aplicacion_enum" NOT NULL DEFAULT 'ACTIVA',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_cierre_sesion" TIMESTAMPTZ(6),
    "motivo_cierre" "usuario"."motivo_cierre_enum",
    "alcance_sesion" "usuario"."alcance_sesion_enum" NOT NULL DEFAULT 'LIMITADA',
    "csrf_token_hash" TEXT,
    "token_hash" TEXT,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "usuario"."solicitudes_recuperacion" (
    "id_solicitud" UUID NOT NULL DEFAULT gen_random_uuid(),
    "correo_electronico" VARCHAR(255) NOT NULL,
    "id_usuario" UUID,
    "direccion_ip" VARCHAR(45) NOT NULL,
    "codigo_hash" TEXT,
    "fecha_solicitud" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMPTZ(6),
    "estado_codigo" "usuario"."estado_codigo_enum" DEFAULT 'ACTIVO',

    CONSTRAINT "solicitudes_recuperacion_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "usuario"."usuarios" (
    "id_usuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "correo_electronico" VARCHAR(255) NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rol" "usuario"."rol_enum" NOT NULL DEFAULT 'ESTUDIANTE',
    "estado_registro" "usuario"."estado_registro_enum" NOT NULL DEFAULT 'PENDIENTE_CONSENTIMIENTO',
    "estado_cuenta" "usuario"."estado_cuenta_enum" NOT NULL DEFAULT 'ACTIVA',
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentimiendo_aceptado" BOOLEAN,
    "registro_consumo_aceptado" BOOLEAN,
    "id_consentimiento" UUID,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE INDEX "ix_contenidos_cronograma_disponibilidad" ON "cronograma"."contenidos_cronograma"("fecha_inicio_disponibilidad" ASC, "fecha_fin_disponibilidad" ASC);

-- CreateIndex
CREATE INDEX "ix_contenidos_cronograma_unidad" ON "cronograma"."contenidos_cronograma"("id_unidad_temporal" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_contenido_unico_en_cronograma" ON "cronograma"."contenidos_cronograma"("id_contenido" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_cronogramas_base_activo" ON "cronograma"."cronogramas"("es_base" ASC) WHERE ((es_base = true) AND (estado = 'ACTIVO'::cronograma.estado_cronograma_enum));

-- CreateIndex
CREATE INDEX "ix_cronogramas_usuario_cronograma" ON "cronograma"."cronogramas_usuario"("id_cronograma" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_cronograma_usuario_unico" ON "cronograma"."cronogramas_usuario"("id_usuario" ASC);

-- CreateIndex
CREATE INDEX "ix_eventos_contenido_cronograma" ON "cronograma"."eventos_contenido"("id_cronograma" ASC, "fecha_cambio" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_evento_contenido_transicion" ON "cronograma"."eventos_contenido"("id_contenido_cronograma" ASC, "estado_nuevo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_modulo_codigo" ON "cronograma"."modulos_sistema"("codigo_modulo" ASC);

-- CreateIndex
CREATE INDEX "ix_pausas_cronograma_usuario" ON "cronograma"."pausas_administrativas"("id_cronograma_usuario" ASC);

-- CreateIndex
CREATE INDEX "ix_pausas_usuario" ON "cronograma"."pausas_administrativas"("id_usuario" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recurso_orden" ON "cronograma"."recursos_contenido"("id_contenido" ASC, "orden_bloque" ASC);

-- CreateIndex
CREATE INDEX "ix_recursos_modulos_destino_modulo" ON "cronograma"."recursos_modulos_destino"("id_modulo" ASC);

-- CreateIndex
CREATE INDEX "ix_unidades_temporales_cronograma" ON "cronograma"."unidades_temporales"("id_cronograma" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_unidad_temporal_orden" ON "cronograma"."unidades_temporales"("id_cronograma" ASC, "orden_unidad" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_linea_base_usuario" ON "usuario"."linea_base"("id_usuario" ASC);

-- CreateIndex
CREATE INDEX "ix_historial_usuario_fecha" ON "usuario"."linea_base_historial"("id_usuario" ASC, "fecha_modificacion" DESC);

-- CreateIndex
CREATE INDEX "ix_sesiones_activa_ultima_interaccion" ON "usuario"."sesiones"("fecha_ultima_interaccion" ASC) WHERE (activa = true);

-- CreateIndex
CREATE INDEX "ix_sesiones_usuario_activa" ON "usuario"."sesiones"("id_usuario" ASC) WHERE (activa = true);

-- CreateIndex
CREATE UNIQUE INDEX "uq_sesiones_token_hash" ON "usuario"."sesiones"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "ix_recuperacion_estado" ON "usuario"."solicitudes_recuperacion"("estado_codigo" ASC);

-- CreateIndex
CREATE INDEX "ix_recuperacion_rate_limit" ON "usuario"."solicitudes_recuperacion"("correo_electronico" ASC, "direccion_ip" ASC, "fecha_solicitud" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_codigo-hash" ON "usuario"."solicitudes_recuperacion"("codigo_hash" ASC);

-- CreateIndex
CREATE INDEX "ix_usuarios_estado_registro" ON "usuario"."usuarios"("estado_registro" ASC);

-- CreateIndex
CREATE INDEX "ix_usuarios_rol" ON "usuario"."usuarios"("rol" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_correo" ON "usuario"."usuarios"("correo_electronico" ASC);

-- AddForeignKey
ALTER TABLE "cronograma"."contenidos_cronograma" ADD CONSTRAINT "fk_contenido_cronograma_contenido" FOREIGN KEY ("id_contenido") REFERENCES "cronograma"."contenidos"("id_contenido") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."contenidos_cronograma" ADD CONSTRAINT "fk_contenido_unidad_temporal" FOREIGN KEY ("id_unidad_temporal") REFERENCES "cronograma"."unidades_temporales"("id_unidad_temporal") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."cronogramas_usuario" ADD CONSTRAINT "fk_cronograma_usuario_cronograma" FOREIGN KEY ("id_cronograma") REFERENCES "cronograma"."cronogramas"("id_cronograma") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."cronogramas_usuario" ADD CONSTRAINT "fk_cronograma_usuario_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."eventos_contenido" ADD CONSTRAINT "fk_evento_contenido" FOREIGN KEY ("id_contenido_cronograma") REFERENCES "cronograma"."contenidos_cronograma"("id_contenido_cronograma") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."eventos_contenido" ADD CONSTRAINT "fk_evento_cronograma" FOREIGN KEY ("id_cronograma") REFERENCES "cronograma"."cronogramas"("id_cronograma") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."pausas_administrativas" ADD CONSTRAINT "fk_pausa_cronograma_usuario" FOREIGN KEY ("id_cronograma_usuario") REFERENCES "cronograma"."cronogramas_usuario"("id_cronograma_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."pausas_administrativas" ADD CONSTRAINT "fk_pausa_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."pausas_administrativas" ADD CONSTRAINT "fk_pausa_usuario_administrativo" FOREIGN KEY ("id_usuario_administrativo") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."recursos_contenido" ADD CONSTRAINT "fk_recurso_contenido" FOREIGN KEY ("id_contenido") REFERENCES "cronograma"."contenidos"("id_contenido") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."recursos_modulos_destino" ADD CONSTRAINT "fk_rmd_modulo" FOREIGN KEY ("id_modulo") REFERENCES "cronograma"."modulos_sistema"("id_modulo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."recursos_modulos_destino" ADD CONSTRAINT "fk_rmd_recurso" FOREIGN KEY ("id_recurso") REFERENCES "cronograma"."recursos_contenido"("id_recurso") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."unidades_temporales" ADD CONSTRAINT "fk_unidad_temporal_cronograma" FOREIGN KEY ("id_cronograma") REFERENCES "cronograma"."cronogramas"("id_cronograma") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."linea_base" ADD CONSTRAINT "fk_linea_base_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."linea_base_historial" ADD CONSTRAINT "fk_historial_linea_base" FOREIGN KEY ("id_linea_base") REFERENCES "usuario"."linea_base"("id_linea_base") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."linea_base_historial" ADD CONSTRAINT "fk_historial_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."sesiones" ADD CONSTRAINT "fk_sesiones_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."solicitudes_recuperacion" ADD CONSTRAINT "fk_recuperacion_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario"."usuarios" ADD CONSTRAINT "fk_usuarios_consentimiento" FOREIGN KEY ("id_consentimiento") REFERENCES "usuario"."consentimientos"("id_consentimiento") ON DELETE RESTRICT ON UPDATE NO ACTION;
