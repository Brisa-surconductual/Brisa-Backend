-- Decisión técnica adicional a los cinco eventos exigidos por HU-03:
-- registrar la creación de reglas reutilizables antes de asociarlas a un flujo.
-- Las operaciones existentes conservan su flujo obligatorio.
ALTER TABLE chat.auditoria_arboles
  ALTER COLUMN id_flujo DROP NOT NULL,
  DROP CONSTRAINT ck_auditoria_arbol_accion,
  ADD CONSTRAINT ck_auditoria_arbol_accion CHECK (accion IN (
    'CREAR_FLUJO', 'CLONAR_VERSION', 'CREAR_NODO', 'EDITAR_NODO',
    'CREAR_TRANSICION', 'EDITAR_TRANSICION', 'PUBLICAR', 'ARCHIVAR',
    'CREAR_REGLA_VALIDACION'
  )),
  ADD CONSTRAINT ck_auditoria_arbol_ambito CHECK (
    (
      accion = 'CREAR_REGLA_VALIDACION'
      AND id_flujo IS NULL
      AND id_objeto IS NOT NULL
    )
    OR
    (
      accion <> 'CREAR_REGLA_VALIDACION'
      AND id_flujo IS NOT NULL
    )
  );
