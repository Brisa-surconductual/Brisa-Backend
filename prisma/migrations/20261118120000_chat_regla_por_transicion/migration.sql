-- RF-25: cada transición (chat.reglas_nodos) tiene su propia regla de
-- validación, 1:1 y nunca compartida. El operador y el valor esperado dejan
-- la transición y pasan a la regla; la regla deja de colgar del nodo origen.
--
-- Escrita para poder reintentarse si un intento anterior quedó a medias
-- (IF EXISTS / IF NOT EXISTS y restricciones que se borran antes de crearse).

-- Reinicio de datos de desarrollo (decisión del equipo): el modelo anterior
-- no se puede convertir sin ambigüedad (regla compartida por nodo, operador y
-- valor en la transición). Nodos y flujos se conservan.
DELETE FROM chat.reglas_nodos;

-- La regla ya no vive en el nodo (se quita antes de borrar las reglas, para
-- que ninguna FK las retenga).
ALTER TABLE chat.nodos DROP CONSTRAINT IF EXISTS fk_nodo_regla_validacion;
DROP INDEX IF EXISTS chat.idx_nodos_regla_validacion;
ALTER TABLE chat.nodos DROP COLUMN IF EXISTS id_regla_validacion;
ALTER TABLE chat.reglas_nodos DROP CONSTRAINT IF EXISTS fk_regla_validacion;

DELETE FROM chat.reglas_validaciones;

-- Cuándo se toma la transición: { "valor": X } en IGUALDAD, { "min", "max" } en RANGO.
ALTER TABLE chat.reglas_validaciones
    ADD COLUMN IF NOT EXISTS operador_condicion chat.operador_condicion_enum NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_esperado JSONB NOT NULL;

-- La transición referencia su regla propia. NULL solo cuando el nodo origen
-- no espera respuesta (CONTINUAR); el UNIQUE impide reutilizarla.
ALTER TABLE chat.reglas_nodos
    DROP COLUMN IF EXISTS operador_condicion,
    DROP COLUMN IF EXISTS valor_condicion,
    ADD COLUMN IF NOT EXISTS id_regla_validacion UUID;

ALTER TABLE chat.reglas_nodos
    DROP CONSTRAINT IF EXISTS uq_reglas_nodos_regla_validacion;

ALTER TABLE chat.reglas_nodos
    ADD CONSTRAINT uq_reglas_nodos_regla_validacion UNIQUE (id_regla_validacion),
    ADD CONSTRAINT fk_regla_validacion FOREIGN KEY (id_regla_validacion)
        REFERENCES chat.reglas_validaciones (id_regla_validacion)
        ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Duplicado de uq_reglas_nodos_origen_orden. En la base es una restricción
-- UNIQUE (no un índice suelto): se borra la restricción, que arrastra su índice.
ALTER TABLE chat.reglas_nodos DROP CONSTRAINT IF EXISTS uq_regla_orden_por_nodo;
DROP INDEX IF EXISTS chat.uq_regla_orden_por_nodo;
