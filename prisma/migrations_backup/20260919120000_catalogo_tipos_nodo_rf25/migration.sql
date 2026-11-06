-- RF-25: catálogo mínimo y estable para construir árboles conversacionales.
-- Los identificadores deterministas permiten referenciar el catálogo en seeds
-- y ambientes reproducibles sin depender de inserciones manuales.
INSERT INTO chat.tipo_nodo (id_tipo_nodo, nombre)
VALUES
  ('25000000-0000-4000-8000-000000000001', 'MENSAJE'),
  ('25000000-0000-4000-8000-000000000002', 'PREGUNTA'),
  ('25000000-0000-4000-8000-000000000003', 'DECISION'),
  ('25000000-0000-4000-8000-000000000004', 'CONTENIDO')
ON CONFLICT (nombre) DO NOTHING;
