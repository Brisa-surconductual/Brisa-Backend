-- Esquema mínimo de integración local. No debe ejecutarse en bases compartidas.
-- Los índices de publicación corresponden a los verificados en Supabase y Prisma.
CREATE SCHEMA usuario;
CREATE SCHEMA cronograma;
CREATE SCHEMA chat;
CREATE TYPE chat.modalidad_enum AS ENUM ('GRUPAL', 'PERSONALIZADA');
CREATE TYPE chat.estado_flujo_enum AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');
CREATE TYPE chat.tipo_dependencia_enum AS ENUM ('ABSTINENCIA_FISICA', 'TOLERANCIA');
CREATE TYPE chat.tipo_craving_enum AS ENUM ('POSITIVO', 'NEGATIVO');
CREATE TYPE chat.tipo_dato_validacion_enum AS ENUM ('TEXTO', 'NUMERICO', 'FECHA', 'SELECCION');
CREATE TYPE chat.operador_condicion_enum AS ENUM ('IGUALDAD', 'RANGO', 'CATEGORIA');
CREATE TABLE usuario.usuarios (id_usuario UUID PRIMARY KEY);
CREATE TABLE cronograma.contenidos (id_contenido UUID PRIMARY KEY);
CREATE TABLE chat.flujo_conversacion (
  id_flujo UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre VARCHAR(150) NOT NULL,
  modalidad chat.modalidad_enum NOT NULL,
  tipo_dependencia chat.tipo_dependencia_enum, tipo_craving chat.tipo_craving_enum,
  estado chat.estado_flujo_enum NOT NULL DEFAULT 'BORRADOR', version INT NOT NULL,
  creado_por UUID NOT NULL REFERENCES usuario.usuarios(id_usuario),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(), fecha_publicacion TIMESTAMPTZ, fecha_archivado TIMESTAMPTZ,
  CONSTRAINT ck_flujo_combinacion_coherente CHECK (
    (modalidad = 'GRUPAL' AND tipo_dependencia IS NULL AND tipo_craving IS NULL)
    OR (modalidad = 'PERSONALIZADA' AND tipo_dependencia IS NOT NULL AND tipo_craving IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_flujo_publicado_personalizada ON chat.flujo_conversacion(modalidad, tipo_dependencia, tipo_craving)
  WHERE estado = 'PUBLICADO'::chat.estado_flujo_enum AND modalidad = 'PERSONALIZADA'::chat.modalidad_enum;
CREATE UNIQUE INDEX uq_flujo_publicado_grupal ON chat.flujo_conversacion(modalidad)
  WHERE estado = 'PUBLICADO'::chat.estado_flujo_enum AND modalidad = 'GRUPAL'::chat.modalidad_enum;
CREATE TABLE chat.tipo_nodo (id_tipo_nodo UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre VARCHAR(50) NOT NULL);
CREATE TABLE chat.nodos (
  id_nodo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_flujo UUID NOT NULL REFERENCES chat.flujo_conversacion(id_flujo),
  id_tipo_nodo UUID NOT NULL REFERENCES chat.tipo_nodo(id_tipo_nodo),
  contenido JSONB NOT NULL, es_nodo_inicial BOOLEAN NOT NULL DEFAULT false, orden INT,
  id_contenido_cronograma UUID CONSTRAINT fk_nodo_contenido_cronograma REFERENCES cronograma.contenidos(id_contenido),
  creado_por UUID NOT NULL REFERENCES usuario.usuarios(id_usuario),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(), fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_nodo_inicial_por_flujo ON chat.nodos(id_flujo) WHERE es_nodo_inicial;
CREATE TABLE chat.reglas_validaciones (
  id_regla_validacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_dato chat.tipo_dato_validacion_enum NOT NULL, obligatorio BOOLEAN NOT NULL DEFAULT true,
  valor_min NUMERIC, valor_max NUMERIC, formato_regex TEXT, valores_permitidos TEXT[], mensaje_error TEXT NOT NULL
);
CREATE TABLE chat.reglas_nodos (
  id_regla UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_flujo UUID NOT NULL REFERENCES chat.flujo_conversacion(id_flujo),
  id_nodo_origen UUID NOT NULL REFERENCES chat.nodos(id_nodo),
  id_nodo_destino UUID NOT NULL REFERENCES chat.nodos(id_nodo),
  id_regla_validacion UUID NOT NULL REFERENCES chat.reglas_validaciones(id_regla_validacion),
  operador_condicion chat.operador_condicion_enum NOT NULL, valor_condicion JSONB NOT NULL,
  orden_evaluacion INT NOT NULL, fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_regla_orden_por_nodo UNIQUE(id_nodo_origen, orden_evaluacion)
);
