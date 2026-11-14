-- RF-27/28/29: catálogos referenciados por respuestas.
-- Conserva los UUID y registros existentes cuando el nombre ya fue configurado.
-- tipo_respuesta es opcional: este RF no inventa categorías clínicas.
INSERT INTO chat.tipo_entrada (id_tipo_entrada, nombre)
VALUES
  ('27000000-0000-4000-8000-000000000101', 'SELECCION_UNICA'),
  ('27000000-0000-4000-8000-000000000102', 'SELECCION_MULTIPLE'),
  ('27000000-0000-4000-8000-000000000103', 'ESCALA'),
  ('27000000-0000-4000-8000-000000000104', 'NUMERICO'),
  ('27000000-0000-4000-8000-000000000105', 'FECHA_HORA'),
  ('27000000-0000-4000-8000-000000000106', 'BOOLEANO'),
  ('27000000-0000-4000-8000-000000000107', 'TEXTO_LIBRE')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO chat.estado_conectividad (id_estado_conectividad, nombre)
VALUES ('27000000-0000-4000-8000-000000000108', 'ONLINE')
ON CONFLICT (nombre) DO NOTHING;
