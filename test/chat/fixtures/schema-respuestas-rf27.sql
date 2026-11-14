-- Extiende schema-hu05.sql exclusivamente en PostgreSQL local desechable.
-- No es una migración del proyecto ni se ejecuta en Supabase.
CREATE TYPE chat.estado_sesion_enum AS ENUM ('ACTIVA', 'PAUSADA', 'COMPLETADA', 'ERROR_CONFIGURACION');
CREATE TYPE chat.estado_sincronizacion_enum AS ENUM ('SINCRONIZADO', 'PENDIENTE', 'ERROR');
CREATE TYPE chat.motivo_pausa_enum AS ENUM ('VOLUNTARIA', 'SOS_CRAVING', 'INACTIVIDAD');
CREATE TYPE chat.estado_registro_historial_enum AS ENUM ('REGISTRADO', 'SESION_INTERRUMPIDA');
CREATE TABLE chat.sesiones (
  id_sesion UUID PRIMARY KEY, id_usuario UUID NOT NULL REFERENCES usuario.usuarios(id_usuario),
  id_flujo_conversacional UUID REFERENCES chat.flujo_conversacion(id_flujo),
  version_arbol_utilizada INT, modalidad_activa chat.modalidad_enum NOT NULL,
  tipo_dependencia chat.tipo_dependencia_enum, tipo_craving chat.tipo_craving_enum,
  id_nodo_actual UUID REFERENCES chat.nodos(id_nodo),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(), fecha_ultima_interaccion TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_sincronizacion chat.estado_sincronizacion_enum NOT NULL DEFAULT 'SINCRONIZADO'
);
CREATE TABLE chat.estado_sesiones (
  id_sesion UUID PRIMARY KEY REFERENCES chat.sesiones(id_sesion),
  estado_actual chat.estado_sesion_enum NOT NULL DEFAULT 'ACTIVA', motivo_pausa chat.motivo_pausa_enum,
  fecha_pausa TIMESTAMPTZ, fecha_reanudacion TIMESTAMPTZ, fecha_completada TIMESTAMPTZ,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_estado_completada_coherente CHECK (estado_actual <> 'COMPLETADA' OR fecha_completada IS NOT NULL),
  CONSTRAINT ck_estado_pausa_coherente CHECK (estado_actual <> 'PAUSADA' OR fecha_pausa IS NOT NULL)
);
CREATE TABLE chat.tipo_entrada (id_tipo_entrada UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre VARCHAR(50) UNIQUE NOT NULL);
CREATE TABLE chat.tipo_respuesta (id_tipo_respuesta UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo VARCHAR(50) UNIQUE NOT NULL, descripcion TEXT);
CREATE TABLE chat.estado_conectividad (id_estado_conectividad UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre VARCHAR(20) UNIQUE NOT NULL);
CREATE TABLE chat.interacciones (
  id_interaccion UUID PRIMARY KEY, id_sesion UUID NOT NULL REFERENCES chat.sesiones(id_sesion),
  id_nodo UUID NOT NULL REFERENCES chat.nodos(id_nodo), timestamp_interaccion TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_sincronizacion chat.estado_sincronizacion_enum NOT NULL DEFAULT 'SINCRONIZADO',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE chat.respuestas (
  id_respuesta UUID PRIMARY KEY, id_interaccion UUID NOT NULL REFERENCES chat.interacciones(id_interaccion),
  id_nodo UUID NOT NULL REFERENCES chat.nodos(id_nodo),
  id_tipo_entrada UUID NOT NULL REFERENCES chat.tipo_entrada(id_tipo_entrada),
  id_tipo_respuesta UUID REFERENCES chat.tipo_respuesta(id_tipo_respuesta),
  id_estado_conectividad UUID NOT NULL REFERENCES chat.estado_conectividad(id_estado_conectividad),
  valor_respuesta JSONB NOT NULL, es_valida BOOLEAN NOT NULL DEFAULT true,
  fecha_captura TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE chat.historial_nodos (
  id_historial BIGSERIAL PRIMARY KEY, id_sesion UUID NOT NULL REFERENCES chat.sesiones(id_sesion),
  id_nodo UUID NOT NULL REFERENCES chat.nodos(id_nodo), id_usuario UUID NOT NULL REFERENCES usuario.usuarios(id_usuario),
  respuesta_usuario JSONB, id_nodo_destino UUID REFERENCES chat.nodos(id_nodo),
  estado_registro chat.estado_registro_historial_enum NOT NULL DEFAULT 'REGISTRADO',
  timestamp_interaccion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat.perfil_clinico (
  id_usuario UUID PRIMARY KEY REFERENCES usuario.usuarios(id_usuario),
  tipo_dependencia chat.tipo_dependencia_enum, tipo_craving chat.tipo_craving_enum,
  fecha_captura_dependencia TIMESTAMPTZ, fecha_captura_craving TIMESTAMPTZ,
  perfil_completo BOOLEAN GENERATED ALWAYS AS (tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL) STORED,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
