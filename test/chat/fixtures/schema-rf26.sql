-- Extiende schema-hu05.sql únicamente para integración local de lectura RF-26.
-- Conserva las columnas y FKs que usan los mappers de sesión y estado.
CREATE TYPE chat.estado_sesion_enum AS ENUM ('ACTIVA', 'PAUSADA', 'COMPLETADA', 'ERROR_CONFIGURACION');
CREATE TABLE chat.sesiones (
  id_sesion UUID PRIMARY KEY,
  id_usuario UUID NOT NULL REFERENCES usuario.usuarios(id_usuario),
  id_flujo_conversacional UUID REFERENCES chat.flujo_conversacion(id_flujo),
  version_arbol_utilizada INT,
  modalidad_activa chat.modalidad_enum NOT NULL,
  tipo_dependencia chat.tipo_dependencia_enum,
  tipo_craving chat.tipo_craving_enum,
  id_nodo_actual UUID REFERENCES chat.nodos(id_nodo),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_ultima_interaccion TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_sincronizacion TEXT NOT NULL DEFAULT 'SINCRONIZADO'
);
CREATE TABLE chat.estado_sesiones (
  id_sesion UUID PRIMARY KEY REFERENCES chat.sesiones(id_sesion) ON DELETE CASCADE,
  estado_actual chat.estado_sesion_enum NOT NULL DEFAULT 'ACTIVA',
  motivo_pausa TEXT,
  fecha_pausa TIMESTAMPTZ,
  fecha_reanudacion TIMESTAMPTZ,
  fecha_completada TIMESTAMPTZ,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solo los campos consultados para recursos de presentación.
CREATE TABLE cronograma.modulos_sistema (
  id_modulo UUID PRIMARY KEY, codigo_modulo VARCHAR(10) UNIQUE NOT NULL,
  nombre_modulo VARCHAR(100) NOT NULL, activo BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE cronograma.recursos_contenido (
  id_recurso UUID PRIMARY KEY, id_contenido UUID NOT NULL REFERENCES cronograma.contenidos(id_contenido),
  tipo_recurso TEXT NOT NULL, orden_bloque INT NOT NULL, texto_contenido TEXT,
  clave_almacenamiento TEXT, mime_type VARCHAR(100), texto_alternativo VARCHAR(255), duracion_segundos INT,
  UNIQUE(id_contenido, orden_bloque)
);
CREATE TABLE cronograma.recursos_modulos_destino (
  id_recurso UUID NOT NULL REFERENCES cronograma.recursos_contenido(id_recurso),
  id_modulo UUID NOT NULL REFERENCES cronograma.modulos_sistema(id_modulo),
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(id_recurso,id_modulo)
);
