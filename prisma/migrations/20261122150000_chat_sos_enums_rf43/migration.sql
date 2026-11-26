-- RF-43 · Protocolo SOS "Tengo ganas de vapear" (1/2): valores de enum.
-- Va en una migración aparte y sin BEGIN/COMMIT: un valor agregado con
-- ADD VALUE no puede usarse en la misma transacción que lo crea, y la
-- migración 2/2 ya los utiliza (CHECK, índices parciales, funciones).

-- Flujo conversacional y sesión del sub-árbol TCC de craving.
ALTER TYPE chat.modalidad_enum ADD VALUE IF NOT EXISTS 'SOS';

-- Origen del evento CHAT_SOS_ACTIVADO en el outbox de RF-39.
ALTER TYPE chat.origen_evento_seguimiento_enum ADD VALUE IF NOT EXISTS 'SOS';
