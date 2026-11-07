-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chat";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cronograma";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "usuario";

-- CreateEnum
CREATE TYPE "usuario"."estado_aplicacion_enum" AS ENUM ('ACTIVA', 'SEGUNDO_PLANO');

-- CreateEnum
CREATE TYPE "usuario"."alcance_sesion_enum" AS ENUM ('LIMITADA', 'COMPLETA');

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
CREATE TYPE "chat"."estado_exportacion_enum" AS ENUM ('PENDIENTE', 'GENERADA', 'ERROR');

-- CreateEnum
CREATE TYPE "chat"."estado_flujo_enum" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "chat"."estado_precarga_enum" AS ENUM ('PENDIENTE', 'COMPLETA', 'PARCIAL', 'FALLIDA');

-- CreateEnum
CREATE TYPE "chat"."estado_punto_control_enum" AS ENUM ('PENDIENTE', 'RESUELTO');

-- CreateEnum
CREATE TYPE "chat"."estado_registro_historial_enum" AS ENUM ('REGISTRADO', 'SESION_INTERRUMPIDA');

-- CreateEnum
CREATE TYPE "chat"."estado_sesion_enum" AS ENUM ('ACTIVA', 'PAUSADA', 'COMPLETADA', 'ERROR_CONFIGURACION');

-- CreateEnum
CREATE TYPE "chat"."estado_sincronizacion_enum" AS ENUM ('SINCRONIZADO', 'PENDIENTE_SINCRONIZACION', 'ERROR_SINCRONIZACION');

-- CreateEnum
CREATE TYPE "chat"."modalidad_enum" AS ENUM ('GRUPAL', 'PERSONALIZADA');

-- CreateEnum
CREATE TYPE "chat"."motivo_pausa_enum" AS ENUM ('MANUAL', 'SOS_CRAVING');

-- CreateEnum
CREATE TYPE "chat"."operador_condicion_enum" AS ENUM ('IGUALDAD', 'RANGO', 'CATEGORIA');

-- CreateEnum
CREATE TYPE "chat"."tipo_craving_enum" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateEnum
CREATE TYPE "chat"."tipo_dato_validacion_enum" AS ENUM ('TEXTO', 'NUMERICO', 'FECHA', 'SELECCION');

-- CreateEnum
CREATE TYPE "chat"."tipo_dependencia_enum" AS ENUM ('ABSTINENCIA_FISICA', 'TOLERANCIA');

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
    "consentimiento_aceptado" BOOLEAN,
    "registro_consumo_aceptado" BOOLEAN,
    "id_consentimiento" UUID,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

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
CREATE TABLE "cronograma"."entregas_evento_contenido" (
    "id_evento" BIGINT NOT NULL,
    "id_modulo" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intentos_publicacion" INTEGER NOT NULL DEFAULT 0,
    "fecha_ultimo_intento" TIMESTAMPTZ(6),
    "fecha_publicacion" TIMESTAMPTZ(6),
    "ultimo_error" VARCHAR(500),

    CONSTRAINT "entregas_evento_contenido_pkey" PRIMARY KEY ("id_evento","id_modulo")
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
CREATE TABLE "cronograma"."limpieza_objetos_recurso" (
    "id_limpieza" BIGSERIAL NOT NULL,
    "id_contenido" UUID NOT NULL,
    "clave_almacenamiento" TEXT NOT NULL,
    "estado" VARCHAR(16) NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "disponible_desde" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '01:05:00'::interval),
    "reclamado_en" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_completado" TIMESTAMPTZ(6),
    "ultimo_error" TEXT,

    CONSTRAINT "limpieza_objetos_recurso_pkey" PRIMARY KEY ("id_limpieza")
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
CREATE TABLE "chat"."estado_conectividad" (
    "id_estado_conectividad" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(20) NOT NULL,

    CONSTRAINT "estado_conectividad_pkey" PRIMARY KEY ("id_estado_conectividad")
);

-- CreateTable
CREATE TABLE "chat"."estado_sesiones" (
    "id_sesion" UUID NOT NULL,
    "estado_actual" "chat"."estado_sesion_enum" NOT NULL DEFAULT 'ACTIVA',
    "motivo_pausa" "chat"."motivo_pausa_enum",
    "fecha_pausa" TIMESTAMPTZ(6),
    "fecha_reanudacion" TIMESTAMPTZ(6),
    "fecha_completada" TIMESTAMPTZ(6),
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_sesiones_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "chat"."exportaciones" (
    "id_exportacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "formato" VARCHAR(20) NOT NULL,
    "estado" "chat"."estado_exportacion_enum" NOT NULL DEFAULT 'PENDIENTE',
    "clave_almacenamiento" TEXT,
    "solicitado_por" UUID NOT NULL,
    "fecha_solicitud" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_generacion" TIMESTAMPTZ(6),

    CONSTRAINT "exportaciones_pkey" PRIMARY KEY ("id_exportacion")
);

-- CreateTable
CREATE TABLE "chat"."flujo_conversacion" (
    "id_flujo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "modalidad" "chat"."modalidad_enum" NOT NULL,
    "tipo_dependencia" "chat"."tipo_dependencia_enum",
    "tipo_craving" "chat"."tipo_craving_enum",
    "estado" "chat"."estado_flujo_enum" NOT NULL DEFAULT 'BORRADOR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creado_por" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_publicacion" TIMESTAMPTZ(6),
    "fecha_archivado" TIMESTAMPTZ(6),

    CONSTRAINT "flujo_conversacion_pkey" PRIMARY KEY ("id_flujo")
);

-- CreateTable
CREATE TABLE "chat"."auditoria_arboles" (
    "id_auditoria" BIGSERIAL NOT NULL,
    "id_flujo" UUID,
    "id_actor" UUID NOT NULL,
    "accion" VARCHAR(40) NOT NULL,
    "id_objeto" UUID,
    "fecha_operacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_arboles_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateTable
CREATE TABLE "chat"."historial_nodos" (
    "id_historial" BIGSERIAL NOT NULL,
    "id_sesion" UUID NOT NULL,
    "id_nodo" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "respuesta_usuario" JSONB,
    "id_nodo_destino" UUID,
    "estado_registro" "chat"."estado_registro_historial_enum" NOT NULL DEFAULT 'REGISTRADO',
    "timestamp_interaccion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_nodos_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "chat"."interacciones" (
    "id_interaccion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_sesion" UUID NOT NULL,
    "id_nodo" UUID NOT NULL,
    "timestamp_interaccion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_sincronizacion" "chat"."estado_sincronizacion_enum" NOT NULL DEFAULT 'SINCRONIZADO',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interacciones_pkey" PRIMARY KEY ("id_interaccion")
);

-- CreateTable
CREATE TABLE "chat"."nodos" (
    "id_nodo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_flujo" UUID NOT NULL,
    "id_tipo_nodo" UUID NOT NULL,
    "contenido" JSONB NOT NULL,
    "es_nodo_inicial" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER,
    "id_contenido_cronograma" UUID,
    "creado_por" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nodos_pkey" PRIMARY KEY ("id_nodo")
);

-- CreateTable
CREATE TABLE "chat"."perfil_clinico" (
    "id_usuario" UUID NOT NULL,
    "tipo_dependencia" "chat"."tipo_dependencia_enum",
    "tipo_craving" "chat"."tipo_craving_enum",
    "fecha_captura_dependencia" TIMESTAMPTZ(6),
    "fecha_captura_craving" TIMESTAMPTZ(6),
    "perfil_completo" BOOLEAN DEFAULT ((tipo_dependencia IS NOT NULL) AND (tipo_craving IS NOT NULL)),
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_clinico_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "chat"."punto_control" (
    "id_punto_control" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_nodo" UUID NOT NULL,
    "id_usuario_responsable" UUID NOT NULL,
    "tipo_control" VARCHAR(50) NOT NULL,
    "estado" "chat"."estado_punto_control_enum" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMPTZ(6),

    CONSTRAINT "punto_control_pkey" PRIMARY KEY ("id_punto_control")
);

-- CreateTable
CREATE TABLE "chat"."reglas_nodos" (
    "id_regla" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_flujo" UUID NOT NULL,
    "id_nodo_origen" UUID NOT NULL,
    "id_nodo_destino" UUID NOT NULL,
    "id_regla_validacion" UUID NOT NULL,
    "operador_condicion" "chat"."operador_condicion_enum" NOT NULL,
    "valor_condicion" JSONB NOT NULL,
    "orden_evaluacion" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglas_nodos_pkey" PRIMARY KEY ("id_regla")
);

-- CreateTable
CREATE TABLE "chat"."reglas_validaciones" (
    "id_regla_validacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_dato" "chat"."tipo_dato_validacion_enum" NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "valor_min" DECIMAL,
    "valor_max" DECIMAL,
    "formato_regex" TEXT,
    "valores_permitidos" TEXT[],
    "mensaje_error" TEXT NOT NULL,

    CONSTRAINT "reglas_validaciones_pkey" PRIMARY KEY ("id_regla_validacion")
);

-- CreateTable
CREATE TABLE "chat"."respuestas" (
    "id_respuesta" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_interaccion" UUID NOT NULL,
    "id_nodo" UUID NOT NULL,
    "id_tipo_entrada" UUID NOT NULL,
    "id_tipo_respuesta" UUID,
    "id_estado_conectividad" UUID NOT NULL,
    "valor_respuesta" JSONB NOT NULL,
    "es_valida" BOOLEAN NOT NULL DEFAULT true,
    "fecha_captura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
CREATE TABLE "chat"."sesiones" (
    "id_sesion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_flujo_conversacional" UUID,
    "version_arbol_utilizada" INTEGER,
    "modalidad_activa" "chat"."modalidad_enum" NOT NULL,
    "tipo_dependencia" "chat"."tipo_dependencia_enum",
    "tipo_craving" "chat"."tipo_craving_enum",
    "id_nodo_actual" UUID,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_interaccion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_sincronizacion" "chat"."estado_sincronizacion_enum" NOT NULL DEFAULT 'SINCRONIZADO',

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "chat"."sincronizaciones" (
    "id_sincronizacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_sesion" UUID,
    "id_unidad_temporal" UUID NOT NULL,
    "version_arbol_local" INTEGER,
    "version_arbol_servidor" INTEGER NOT NULL,
    "estado_precarga" "chat"."estado_precarga_enum" NOT NULL DEFAULT 'PENDIENTE',
    "limite_almacenamiento_local" INTEGER,
    "espacio_disponible_dispositivo" INTEGER,
    "timestamp_precarga" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sincronizaciones_pkey" PRIMARY KEY ("id_sincronizacion")
);

-- CreateTable
CREATE TABLE "chat"."tipo_entrada" (
    "id_tipo_entrada" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "tipo_entrada_pkey" PRIMARY KEY ("id_tipo_entrada")
);

-- CreateTable
CREATE TABLE "chat"."tipo_nodo" (
    "id_tipo_nodo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "tipo_nodo_pkey" PRIMARY KEY ("id_tipo_nodo")
);

-- CreateTable
CREATE TABLE "chat"."tipo_respuesta" (
    "id_tipo_respuesta" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipo_respuesta_pkey" PRIMARY KEY ("id_tipo_respuesta")
);

-- CreateTable
CREATE TABLE "chat"."tipo_terapia" (
    "id_tipo_terapia" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_programa" INTEGER NOT NULL,
    "modalidad" "chat"."modalidad_enum" NOT NULL,
    "fecha_vigencia_desde" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vigencia_hasta" TIMESTAMPTZ(6),
    "administrador_responsable" UUID,

    CONSTRAINT "tipo_terapia_pkey" PRIMARY KEY ("id_tipo_terapia")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_linea_base_usuario" ON "usuario"."linea_base"("id_usuario");

-- CreateIndex
CREATE INDEX "ix_historial_usuario_fecha" ON "usuario"."linea_base_historial"("id_usuario", "fecha_modificacion" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_sesiones_token_hash" ON "usuario"."sesiones"("token_hash");

-- CreateIndex
CREATE INDEX "ix_sesiones_activa_ultima_interaccion" ON "usuario"."sesiones"("fecha_ultima_interaccion") WHERE (activa = true);

-- CreateIndex
CREATE INDEX "ix_sesiones_usuario_activa" ON "usuario"."sesiones"("id_usuario") WHERE (activa = true);

-- CreateIndex
CREATE UNIQUE INDEX "uq_codigo-hash" ON "usuario"."solicitudes_recuperacion"("codigo_hash");

-- CreateIndex
CREATE INDEX "ix_recuperacion_estado" ON "usuario"."solicitudes_recuperacion"("estado_codigo");

-- CreateIndex
CREATE INDEX "ix_recuperacion_rate_limit" ON "usuario"."solicitudes_recuperacion"("correo_electronico", "direccion_ip", "fecha_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_correo" ON "usuario"."usuarios"("correo_electronico");

-- CreateIndex
CREATE INDEX "ix_usuarios_estado_registro" ON "usuario"."usuarios"("estado_registro");

-- CreateIndex
CREATE INDEX "ix_usuarios_rol" ON "usuario"."usuarios"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "uq_contenido_unico_en_cronograma" ON "cronograma"."contenidos_cronograma"("id_contenido");

-- CreateIndex
CREATE INDEX "ix_contenidos_cronograma_disponibilidad" ON "cronograma"."contenidos_cronograma"("fecha_inicio_disponibilidad", "fecha_fin_disponibilidad");

-- CreateIndex
CREATE INDEX "ix_contenidos_cronograma_unidad" ON "cronograma"."contenidos_cronograma"("id_unidad_temporal");

-- CreateIndex
CREATE UNIQUE INDEX "uq_contenido_orden_en_unidad_temporal" ON "cronograma"."contenidos_cronograma"("id_unidad_temporal", "orden_contenido") WHERE (orden_contenido IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "uq_cronogramas_base_activo" ON "cronograma"."cronogramas"("es_base") WHERE ((es_base = true) AND (estado = 'ACTIVO'::cronograma.estado_cronograma_enum));

-- CreateIndex
CREATE UNIQUE INDEX "uq_cronograma_usuario_unico" ON "cronograma"."cronogramas_usuario"("id_usuario");

-- CreateIndex
CREATE INDEX "ix_cronogramas_usuario_cronograma" ON "cronograma"."cronogramas_usuario"("id_cronograma");

-- CreateIndex
CREATE INDEX "ix_eventos_contenido_cronograma" ON "cronograma"."eventos_contenido"("id_cronograma", "fecha_cambio");

-- CreateIndex
CREATE UNIQUE INDEX "uq_evento_contenido_transicion" ON "cronograma"."eventos_contenido"("id_contenido_cronograma", "estado_nuevo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_modulo_codigo" ON "cronograma"."modulos_sistema"("codigo_modulo");

-- CreateIndex
CREATE INDEX "ix_entregas_evento_pendientes" ON "cronograma"."entregas_evento_contenido"("fecha_creacion") WHERE (fecha_publicacion IS NULL);

-- CreateIndex
CREATE INDEX "ix_pausas_cronograma_usuario" ON "cronograma"."pausas_administrativas"("id_cronograma_usuario");

-- CreateIndex
CREATE INDEX "ix_pausas_usuario" ON "cronograma"."pausas_administrativas"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "uq_recurso_clave_almacenamiento" ON "cronograma"."recursos_contenido"("clave_almacenamiento") WHERE (clave_almacenamiento IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recurso_orden" ON "cronograma"."recursos_contenido"("id_contenido", "orden_bloque");

-- CreateIndex
CREATE UNIQUE INDEX "limpieza_objetos_recurso_clave_almacenamiento_key" ON "cronograma"."limpieza_objetos_recurso"("clave_almacenamiento");

-- CreateIndex
CREATE INDEX "ix_limpieza_objetos_pendientes" ON "cronograma"."limpieza_objetos_recurso"("disponible_desde", "id_limpieza") WHERE ((estado)::text <> 'COMPLETADO'::text);

-- CreateIndex
CREATE INDEX "ix_recursos_modulos_destino_modulo" ON "cronograma"."recursos_modulos_destino"("id_modulo");

-- CreateIndex
CREATE INDEX "ix_unidades_temporales_cronograma" ON "cronograma"."unidades_temporales"("id_cronograma");

-- CreateIndex
CREATE UNIQUE INDEX "uq_unidad_temporal_orden" ON "cronograma"."unidades_temporales"("id_cronograma", "orden_unidad");

-- CreateIndex
CREATE UNIQUE INDEX "estado_conectividad_nombre_key" ON "chat"."estado_conectividad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_flujo_publicado_grupal" ON "chat"."flujo_conversacion"("modalidad") WHERE ((estado = 'PUBLICADO'::chat.estado_flujo_enum) AND (modalidad = 'GRUPAL'::chat.modalidad_enum));

-- CreateIndex
CREATE UNIQUE INDEX "uq_flujo_publicado_personalizada" ON "chat"."flujo_conversacion"("modalidad", "tipo_dependencia", "tipo_craving") WHERE ((estado = 'PUBLICADO'::chat.estado_flujo_enum) AND (modalidad = 'PERSONALIZADA'::chat.modalidad_enum));

-- CreateIndex
CREATE UNIQUE INDEX "uq_flujo_version_personalizada" ON "chat"."flujo_conversacion"("tipo_dependencia", "tipo_craving", "version") WHERE (modalidad = 'PERSONALIZADA'::chat.modalidad_enum);

-- CreateIndex
CREATE INDEX "ix_auditoria_arbol_flujo_fecha" ON "chat"."auditoria_arboles"("id_flujo", "fecha_operacion");

-- CreateIndex
CREATE INDEX "ix_historial_sesion" ON "chat"."historial_nodos"("id_sesion", "timestamp_interaccion");

-- CreateIndex
CREATE INDEX "ix_interacciones_sesion_tiempo" ON "chat"."interacciones"("id_sesion", "timestamp_interaccion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nodo_inicial_por_flujo" ON "chat"."nodos"("id_flujo") WHERE (es_nodo_inicial = true);

-- CreateIndex
CREATE UNIQUE INDEX "uq_regla_orden_por_nodo" ON "chat"."reglas_nodos"("id_nodo_origen", "orden_evaluacion");

-- CreateIndex
CREATE INDEX "ix_sesiones_usuario" ON "chat"."sesiones"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_entrada_nombre_key" ON "chat"."tipo_entrada"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_nodo_nombre_key" ON "chat"."tipo_nodo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_respuesta_codigo_key" ON "chat"."tipo_respuesta"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tipoterapia_vigente_por_usuario" ON "chat"."tipo_terapia"("id_usuario") WHERE (fecha_vigencia_hasta IS NULL);

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

-- AddForeignKey
ALTER TABLE "cronograma"."contenidos_cronograma" ADD CONSTRAINT "fk_contenido_cronograma_contenido" FOREIGN KEY ("id_contenido") REFERENCES "cronograma"."contenidos"("id_contenido") ON DELETE CASCADE ON UPDATE NO ACTION;

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
ALTER TABLE "cronograma"."entregas_evento_contenido" ADD CONSTRAINT "fk_entrega_evento" FOREIGN KEY ("id_evento") REFERENCES "cronograma"."eventos_contenido"("id_evento") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cronograma"."entregas_evento_contenido" ADD CONSTRAINT "fk_entrega_modulo" FOREIGN KEY ("id_modulo") REFERENCES "cronograma"."modulos_sistema"("id_modulo") ON DELETE RESTRICT ON UPDATE NO ACTION;

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
ALTER TABLE "chat"."estado_sesiones" ADD CONSTRAINT "fk_estado_sesion" FOREIGN KEY ("id_sesion") REFERENCES "chat"."sesiones"("id_sesion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."exportaciones" ADD CONSTRAINT "fk_exportacion_perfil" FOREIGN KEY ("id_usuario") REFERENCES "chat"."perfil_clinico"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."exportaciones" ADD CONSTRAINT "fk_exportacion_solicitante" FOREIGN KEY ("solicitado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."flujo_conversacion" ADD CONSTRAINT "fk_flujo_creado_por" FOREIGN KEY ("creado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."auditoria_arboles" ADD CONSTRAINT "fk_auditoria_arbol_actor" FOREIGN KEY ("id_actor") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."auditoria_arboles" ADD CONSTRAINT "fk_auditoria_arbol_flujo" FOREIGN KEY ("id_flujo") REFERENCES "chat"."flujo_conversacion"("id_flujo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."historial_nodos" ADD CONSTRAINT "fk_historial_nodo" FOREIGN KEY ("id_nodo") REFERENCES "chat"."nodos"("id_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."historial_nodos" ADD CONSTRAINT "fk_historial_nodo_destino" FOREIGN KEY ("id_nodo_destino") REFERENCES "chat"."nodos"("id_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."historial_nodos" ADD CONSTRAINT "fk_historial_sesion" FOREIGN KEY ("id_sesion") REFERENCES "chat"."sesiones"("id_sesion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."historial_nodos" ADD CONSTRAINT "fk_historial_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."interacciones" ADD CONSTRAINT "fk_interaccion_nodo" FOREIGN KEY ("id_nodo") REFERENCES "chat"."nodos"("id_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."interacciones" ADD CONSTRAINT "fk_interaccion_sesion" FOREIGN KEY ("id_sesion") REFERENCES "chat"."sesiones"("id_sesion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."nodos" ADD CONSTRAINT "fk_nodo_contenido_cronograma" FOREIGN KEY ("id_contenido_cronograma") REFERENCES "cronograma"."contenidos"("id_contenido") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."nodos" ADD CONSTRAINT "fk_nodo_creado_por" FOREIGN KEY ("creado_por") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."nodos" ADD CONSTRAINT "fk_nodo_flujo" FOREIGN KEY ("id_flujo") REFERENCES "chat"."flujo_conversacion"("id_flujo") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."nodos" ADD CONSTRAINT "fk_nodo_tipo" FOREIGN KEY ("id_tipo_nodo") REFERENCES "chat"."tipo_nodo"("id_tipo_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."perfil_clinico" ADD CONSTRAINT "fk_perfil_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."punto_control" ADD CONSTRAINT "fk_punto_control_nodo" FOREIGN KEY ("id_nodo") REFERENCES "chat"."nodos"("id_nodo") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."punto_control" ADD CONSTRAINT "fk_punto_control_usuario" FOREIGN KEY ("id_usuario_responsable") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."reglas_nodos" ADD CONSTRAINT "fk_regla_flujo" FOREIGN KEY ("id_flujo") REFERENCES "chat"."flujo_conversacion"("id_flujo") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."reglas_nodos" ADD CONSTRAINT "fk_regla_nodo_destino" FOREIGN KEY ("id_nodo_destino") REFERENCES "chat"."nodos"("id_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."reglas_nodos" ADD CONSTRAINT "fk_regla_nodo_origen" FOREIGN KEY ("id_nodo_origen") REFERENCES "chat"."nodos"("id_nodo") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."reglas_nodos" ADD CONSTRAINT "fk_regla_validacion" FOREIGN KEY ("id_regla_validacion") REFERENCES "chat"."reglas_validaciones"("id_regla_validacion") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."respuestas" ADD CONSTRAINT "fk_respuesta_conectividad" FOREIGN KEY ("id_estado_conectividad") REFERENCES "chat"."estado_conectividad"("id_estado_conectividad") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."respuestas" ADD CONSTRAINT "fk_respuesta_interaccion" FOREIGN KEY ("id_interaccion") REFERENCES "chat"."interacciones"("id_interaccion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."respuestas" ADD CONSTRAINT "fk_respuesta_nodo" FOREIGN KEY ("id_nodo") REFERENCES "chat"."nodos"("id_nodo") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."respuestas" ADD CONSTRAINT "fk_respuesta_tipo_entrada" FOREIGN KEY ("id_tipo_entrada") REFERENCES "chat"."tipo_entrada"("id_tipo_entrada") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."respuestas" ADD CONSTRAINT "fk_respuesta_tipo_respuesta" FOREIGN KEY ("id_tipo_respuesta") REFERENCES "chat"."tipo_respuesta"("id_tipo_respuesta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sesiones" ADD CONSTRAINT "fk_sesion_flujo" FOREIGN KEY ("id_flujo_conversacional") REFERENCES "chat"."flujo_conversacion"("id_flujo") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sesiones" ADD CONSTRAINT "fk_sesion_nodo_actual" FOREIGN KEY ("id_nodo_actual") REFERENCES "chat"."nodos"("id_nodo") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sesiones" ADD CONSTRAINT "fk_sesion_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sincronizaciones" ADD CONSTRAINT "fk_sync_sesion" FOREIGN KEY ("id_sesion") REFERENCES "chat"."sesiones"("id_sesion") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sincronizaciones" ADD CONSTRAINT "fk_sync_unidad_temporal" FOREIGN KEY ("id_unidad_temporal") REFERENCES "cronograma"."unidades_temporales"("id_unidad_temporal") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."sincronizaciones" ADD CONSTRAINT "fk_sync_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."tipo_terapia" ADD CONSTRAINT "fk_tipoterapia_admin" FOREIGN KEY ("administrador_responsable") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat"."tipo_terapia" ADD CONSTRAINT "fk_tipoterapia_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;
