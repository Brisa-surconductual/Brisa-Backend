-- RF-25: cada transición (chat.reglas_nodos) tiene su propia regla de
-- validación, 1:1 y nunca compartida. El operador y el valor esperado dejan
-- la transición y pasan a la regla; la regla deja de colgar del nodo origen.

-- Reinicio de datos de desarrollo (decisión del equipo): el modelo anterior
-- no se puede convertir sin ambigüedad (regla compartida por nodo, operador y
-- valor en la transición). Nodos y flujos se conservan.
DELETE FROM chat.reglas_nodos;
UPDATE chat.nodos SET id_regla_validacion = NULL;
DELETE FROM chat.reglas_validaciones;

-- La regla ya no vive en el nodo.
ALTER TABLE chat.nodos DROP CONSTRAINT fk_nodo_regla_validacion;
DROP INDEX chat.idx_nodos_regla_validacion;
ALTER TABLE chat.nodos DROP COLUMN id_regla_validacion;

-- Cuándo se toma la transición: { "valor": X } en IGUALDAD, { "min", "max" } en RANGO.
ALTER TABLE chat.reglas_validaciones
    ADD COLUMN operador_condicion chat.operador_condicion_enum NOT NULL,
    ADD COLUMN valor_esperado JSONB NOT NULL;

-- La transición referencia su regla propia. NULL solo cuando el nodo origen
-- no espera respuesta (CONTINUAR); el UNIQUE impide reutilizarla.
ALTER TABLE chat.reglas_nodos
    DROP COLUMN operador_condicion,
    DROP COLUMN valor_condicion,
    ADD COLUMN id_regla_validacion UUID;

ALTER TABLE chat.reglas_nodos
    ADD CONSTRAINT uq_reglas_nodos_regla_validacion UNIQUE (id_regla_validacion),
    ADD CONSTRAINT fk_regla_validacion FOREIGN KEY (id_regla_validacion)
        REFERENCES chat.reglas_validaciones (id_regla_validacion)
        ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Índice único duplicado de uq_reglas_nodos_origen_orden.
DROP INDEX chat.uq_regla_orden_por_nodo;
