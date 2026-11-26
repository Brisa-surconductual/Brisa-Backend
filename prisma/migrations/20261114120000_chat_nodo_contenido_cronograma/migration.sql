-- =====================================================================
-- Migración: chat_nodo_contenido_cronograma
-- Proyecto : Brisa · Módulo M-3 Chat / M-4 Cronograma
-- Fecha    : 2026-11-14
-- Alcance  : chat.nodos deja de asociarse directamente a
--            cronograma.contenidos (RF-25) y pasa a asociarse a
--            cronograma.contenidos_cronograma, que es la única tabla con
--            la garantía de que el contenido ya está vinculado a una
--            unidad temporal real de un cronograma (RF-152/RF-154). Evita
--            que un nodo del árbol conversacional muestre al estudiante
--            un contenido que nunca fue programado en ningún cronograma.
-- Ejecutar : con rol dba (ALTER TABLE/CONSTRAINT). UTF-8 sin BOM.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Diagnóstico previo (informativo; no aborta la migración). Un nodo
--    cuyo contenido nunca se asoció a una unidad temporal queda, más
--    abajo, con la referencia en NULL: es justamente el caso inválido
--    que esta migración corrige.
-- ---------------------------------------------------------------------
DO $$
DECLARE n_huerfanos integer;
BEGIN
  SELECT count(*) INTO n_huerfanos
  FROM chat.nodos n
  WHERE n.id_contenido IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM cronograma.contenidos_cronograma cc
      WHERE cc.id_contenido = n.id_contenido
    );

  IF n_huerfanos > 0 THEN
    RAISE NOTICE 'chat_nodo_contenido_cronograma: % nodo(s) referencian un contenido sin asociar a ninguna unidad temporal. Esa referencia quedará en NULL.', n_huerfanos;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Nombre honesto, segunda vuelta: la columna vuelve a llamarse
--    id_contenido_cronograma (como ya la nombran el dominio, los DTO y
--    la ficha RF-25), pero esta vez apunta de verdad a
--    contenidos_cronograma. Se retira la FK vieja antes de reescribir
--    los valores para no violarla con los nuevos UUID.
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos RENAME COLUMN id_contenido TO id_contenido_cronograma;
ALTER TABLE chat.nodos DROP CONSTRAINT fk_nodo_contenido;

-- ---------------------------------------------------------------------
-- 2. Reescribe el valor: de "id de contenido" a "id de la asociación
--    contenido-cronograma" que referencia ese mismo contenido. El LEFT
--    JOIN deja en NULL los nodos cuyo contenido nunca se programó en
--    una unidad temporal (el caso huérfano detectado arriba).
-- ---------------------------------------------------------------------
WITH mapeo AS (
  SELECT n.id_nodo, cc.id_contenido_cronograma AS nuevo_valor
  FROM chat.nodos n
  LEFT JOIN cronograma.contenidos_cronograma cc
    ON cc.id_contenido = n.id_contenido_cronograma
  WHERE n.id_contenido_cronograma IS NOT NULL
)
UPDATE chat.nodos n
SET id_contenido_cronograma = mapeo.nuevo_valor
FROM mapeo
WHERE mapeo.id_nodo = n.id_nodo;

-- ---------------------------------------------------------------------
-- 3. FK real contra contenidos_cronograma. ON DELETE SET NULL: si se
--    desvincula el contenido de su unidad temporal (RF-18) o se elimina
--    la asociación, el nodo conserva su conversación y solo pierde el
--    contenido adjunto; nunca se borra un nodo por un cambio de
--    cronograma.
-- ---------------------------------------------------------------------
ALTER TABLE chat.nodos
  ADD CONSTRAINT fk_nodo_contenido_cronograma
    FOREIGN KEY (id_contenido_cronograma)
    REFERENCES cronograma.contenidos_cronograma (id_contenido_cronograma)
    ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS idx_nodos_contenido_cronograma
  ON chat.nodos (id_contenido_cronograma);

COMMENT ON COLUMN chat.nodos.id_contenido_cronograma IS
  'RF-25. Referencia opcional a cronograma.contenidos_cronograma: solo contenido ya asociado a una unidad temporal de un cronograma puede mostrarse en un nodo. No referencia cronograma.contenidos directamente (evita contenido huérfano sin cronograma).';
