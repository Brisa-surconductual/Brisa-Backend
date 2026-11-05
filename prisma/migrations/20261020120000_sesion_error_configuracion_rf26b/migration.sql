-- RF-26B: cuando no existe un árbol personalizado publicado para el perfil del
-- usuario, la sesión se registra en estado ERROR_CONFIGURACION y no referencia
-- ningún árbol activo (ni flujo, ni versión, ni nodo).
ALTER TYPE chat.estado_sesion_enum ADD VALUE IF NOT EXISTS 'ERROR_CONFIGURACION';

ALTER TABLE chat.sesiones
  ALTER COLUMN id_flujo_conversacional DROP NOT NULL,
  ALTER COLUMN version_arbol_utilizada DROP NOT NULL,
  ALTER COLUMN id_nodo_actual DROP NOT NULL;
