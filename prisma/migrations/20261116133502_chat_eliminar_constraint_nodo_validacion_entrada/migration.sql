-- La fuente real del tipo de entrada de un nodo es `contenido.entrada.tipo`
-- (lo usa CapturarRespuesta.entrada() en tiempo real, RF-27). La columna
-- chat.nodos.id_tipo_entrada nunca se escribe desde ningún caso de uso: no
-- hay catálogo ni formulario que la asigne. Como la restricción exige esa
-- columna no nula en cuanto el nodo tiene id_regla_validacion (asignado
-- automáticamente al crear cualquier transición, ver
-- asignarReglaANodoOrigen), bloqueaba la creación de toda transición.
-- Se elimina la restricción; el resto del backend queda igual.
ALTER TABLE chat.nodos DROP CONSTRAINT ck_nodo_validacion_requiere_entrada;
ALTER TABLE chat.nodos DROP COLUMN id_tipo_entrada;