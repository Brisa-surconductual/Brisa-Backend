-- Migración: chat_nodo_final_usabilidad
-- Fecha: 2026-11-21
-- Descripción: RF-25 · nodo final explícito del flujo conversacional.
--   Un flujo tiene a lo sumo un nodo final (índice parcial único, igual que el
--   nodo inicial) y un nodo no puede ser inicial y final a la vez.
--   Contrato: docs/CONTRATO_RF25_USABILIDAD_FLUJO.md

BEGIN;

ALTER TABLE chat.nodos
  ADD COLUMN IF NOT EXISTS es_nodo_final boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN chat.nodos.es_nodo_final IS
  'RF-25: marca el nodo de cierre del flujo; al llegar a él la sesión se completa.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_nodo_final_por_flujo
  ON chat.nodos (id_flujo)
  WHERE es_nodo_final = true;

ALTER TABLE chat.nodos DROP CONSTRAINT IF EXISTS ck_nodos_inicial_no_final;
ALTER TABLE chat.nodos
  ADD CONSTRAINT ck_nodos_inicial_no_final
  CHECK (NOT (es_nodo_inicial AND es_nodo_final));

COMMIT;
