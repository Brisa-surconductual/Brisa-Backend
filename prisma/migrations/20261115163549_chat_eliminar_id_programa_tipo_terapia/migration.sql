-- id_programa nunca estuvo respaldado por un catálogo real de programas
-- (ver docs/RF25B_DECISIONES_TECNICAS.md, sección "Existencia del programa").
-- La transición GRUPAL -> PERSONALIZADA (RF-25B) pasa a aplicarse sobre
-- todas las asignaciones vigentes, sin partición por programa: hoy no existe
-- ningún mecanismo que distinga un "programa" real de otro, así que esa
-- partición no aportaba información ni comportamiento distinto.
ALTER TABLE chat.tipo_terapia DROP COLUMN id_programa;
