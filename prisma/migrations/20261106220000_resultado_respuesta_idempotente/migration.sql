-- RF-27/28/29: resultado confirmado para reenvíos, sin recalcular una transición.
-- Nullable: no inventa resultados para respuestas históricas.
ALTER TABLE chat.respuestas ADD COLUMN resultado_procesamiento JSONB;

-- Literales del contrato nuevo. Se conservan catálogos e identificadores previos.
INSERT INTO chat.tipo_entrada (id_tipo_entrada, nombre) VALUES
  ('27000000-0000-4000-8000-000000000201', 'OPCION_UNICA'),
  ('27000000-0000-4000-8000-000000000202', 'MULTISELECCION'),
  ('27000000-0000-4000-8000-000000000203', 'CONTINUAR')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO chat.estado_conectividad (id_estado_conectividad, nombre)
VALUES ('27000000-0000-4000-8000-000000000204', 'EN_LINEA')
ON CONFLICT (nombre) DO NOTHING;
