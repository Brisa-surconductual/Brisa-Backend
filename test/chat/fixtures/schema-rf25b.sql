-- Esquema minimo de integracion RF-25B.
-- Exclusivamente para un cluster PostgreSQL temporal.
-- No representa una migracion de produccion.

CREATE SCHEMA usuario;
CREATE SCHEMA chat;

CREATE TYPE usuario.rol_enum AS ENUM (
  'ESTUDIANTE',
  'ADMINISTRATIVO'
);

CREATE TYPE usuario.estado_cuenta_enum AS ENUM (
  'PENDIENTE_ACTIVACION',
  'ACTIVA',
  'BLOQUEADA'
);

CREATE TYPE chat.modalidad_enum AS ENUM (
  'GRUPAL',
  'PERSONALIZADA'
);

CREATE TABLE usuario.usuarios (
  id_usuario UUID PRIMARY KEY,
  rol usuario.rol_enum NOT NULL,
  estado_cuenta usuario.estado_cuenta_enum NOT NULL
);

CREATE TABLE chat.perfil_clinico (
  id_usuario UUID PRIMARY KEY
    REFERENCES usuario.usuarios(id_usuario),
  tipo_dependencia TEXT,
  tipo_craving TEXT,
  perfil_completo BOOLEAN GENERATED ALWAYS AS (
    tipo_dependencia IS NOT NULL
    AND tipo_craving IS NOT NULL
  ) STORED
);

CREATE TABLE chat.tipo_terapia (
  id_tipo_terapia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL
    REFERENCES usuario.usuarios(id_usuario),
  id_programa INTEGER NOT NULL,
  modalidad chat.modalidad_enum NOT NULL,
  fecha_vigencia_desde TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vigencia_hasta TIMESTAMPTZ,
  administrador_responsable UUID
    REFERENCES usuario.usuarios(id_usuario)
);

CREATE UNIQUE INDEX uq_tipoterapia_vigente_por_usuario
ON chat.tipo_terapia(id_usuario)
WHERE fecha_vigencia_hasta IS NULL;

-- Estructuras representativas de las relaciones conversacionales.
CREATE TABLE chat.flujo_conversacion (
  id_flujo UUID PRIMARY KEY
);

CREATE TABLE chat.nodos (
  id_nodo UUID PRIMARY KEY,
  id_flujo UUID NOT NULL REFERENCES chat.flujo_conversacion(id_flujo)
);

CREATE TABLE chat.sesiones (
  id_sesion UUID PRIMARY KEY,
  id_usuario UUID NOT NULL REFERENCES usuario.usuarios(id_usuario) ON DELETE CASCADE,
  id_flujo_conversacional UUID NOT NULL REFERENCES chat.flujo_conversacion(id_flujo),
  version_arbol_utilizada INTEGER NOT NULL,
  modalidad_activa chat.modalidad_enum NOT NULL,
  id_nodo_actual UUID NOT NULL REFERENCES chat.nodos(id_nodo),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_ultima_interaccion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat.historial_nodos (
  id_historial BIGSERIAL PRIMARY KEY,
  id_sesion UUID NOT NULL REFERENCES chat.sesiones(id_sesion) ON DELETE CASCADE,
  id_nodo UUID NOT NULL REFERENCES chat.nodos(id_nodo),
  id_usuario UUID NOT NULL REFERENCES usuario.usuarios(id_usuario) ON DELETE CASCADE,
  respuesta_usuario JSONB,
  id_nodo_destino UUID REFERENCES chat.nodos(id_nodo),
  timestamp_interaccion TIMESTAMPTZ NOT NULL DEFAULT now()
);
