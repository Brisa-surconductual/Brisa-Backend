-- RF-25: un nodo con entrada BOOLEANO (sí/no) necesita un `tipo_dato` propio
-- para su regla de validación; ninguno de los existentes (TEXTO, NUMERICO,
-- FECHA, SELECCION) representa una decisión booleana sin ambigüedad.
ALTER TYPE chat.tipo_dato_validacion_enum ADD VALUE 'DECISION';
