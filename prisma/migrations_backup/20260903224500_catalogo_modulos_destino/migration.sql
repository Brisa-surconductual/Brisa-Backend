INSERT INTO cronograma.modulos_sistema (
  id_modulo,
  codigo_modulo,
  nombre_modulo,
  activo
)
VALUES
  ('00000000-0000-4000-8000-000000000003', 'CHAT', 'Chat', true),
  ('00000000-0000-4000-8000-000000000005', 'SEGUIM', 'Seguimiento', true),
  ('00000000-0000-4000-8000-000000000006', 'GAMIF', 'Gamificación', true),
  ('00000000-0000-4000-8000-000000000007', 'NOTIF', 'Notificaciones', true)
ON CONFLICT (codigo_modulo) DO UPDATE
SET nombre_modulo = EXCLUDED.nombre_modulo,
    activo = true;
