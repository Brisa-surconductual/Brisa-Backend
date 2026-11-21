-- RF-31: verificación de solo lectura, sobre la versión fijada a la sesión.
CREATE FUNCTION chat.fn_validar_historial_sesion(p_id_sesion uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  WITH sesion AS (
    SELECT s.*
    FROM chat.sesiones s
    JOIN chat.flujo_conversacion f
      ON (f.id_flujo, f.version) =
         (s.id_flujo_conversacional, s.version_arbol_utilizada)
    JOIN chat.nodos actual
      ON (actual.id_nodo, actual.id_flujo) =
         (s.id_nodo_actual, f.id_flujo)
    WHERE s.id_sesion = p_id_sesion
  ),
  interacciones AS (
    SELECT i.id_interaccion, i.id_nodo, i.secuencia
    FROM chat.interacciones i
    WHERE i.id_sesion = p_id_sesion
  ),
  historial AS (
    SELECT h.*, i.id_interaccion AS interaccion_en_sesion,
           i.id_nodo AS nodo_interaccion, i.secuencia
    FROM chat.historial_nodos h
    LEFT JOIN interacciones i USING (id_interaccion)
    WHERE h.id_sesion = p_id_sesion
  ),
  pasos AS (
    SELECT h.*,
           lag(h.id_nodo_destino) OVER orden AS destino_anterior,
           row_number() OVER orden AS posicion
    FROM historial h
    WHERE h.estado_registro = 'REGISTRADO'
    -- Los registros anteriores al vínculo forman el prefijo histórico.
    WINDOW orden AS (ORDER BY h.secuencia NULLS FIRST, h.id_historial)
  )
  SELECT EXISTS (
    SELECT 1 FROM sesion s
    WHERE (SELECT count(*) = coalesce(max(secuencia), 0)
                  AND coalesce(min(secuencia), 1) = 1 FROM interacciones)
      AND NOT EXISTS (
        SELECT 1
        FROM interacciones i
        JOIN chat.nodos n ON n.id_nodo = i.id_nodo
        WHERE n.id_flujo <> s.id_flujo_conversacional
      )
      AND NOT EXISTS (
        SELECT 1
        FROM historial h
        LEFT JOIN chat.nodos origen ON origen.id_nodo = h.id_nodo
        LEFT JOIN chat.nodos destino ON destino.id_nodo = h.id_nodo_destino
        WHERE h.id_usuario <> s.id_usuario
           OR origen.id_flujo IS DISTINCT FROM s.id_flujo_conversacional
           OR (h.id_nodo_destino IS NOT NULL AND
               destino.id_flujo IS DISTINCT FROM s.id_flujo_conversacional)
           OR (h.id_interaccion IS NOT NULL AND
               (h.interaccion_en_sesion IS NULL OR h.id_nodo <> h.nodo_interaccion
                OR h.estado_registro <> 'REGISTRADO'))
      )
      AND NOT EXISTS (
        SELECT 1
        FROM interacciones i
        WHERE NOT EXISTS (SELECT 1 FROM historial h WHERE h.id_interaccion = i.id_interaccion)
          AND (
            i.secuencia >= (SELECT min(h.secuencia) FROM historial h)
            OR EXISTS (
              SELECT 1 FROM chat.respuestas r
              WHERE r.id_interaccion = i.id_interaccion
                AND r.resultado_procesamiento #>> '{resultado,id_interaccion}' = i.id_interaccion::text
            )
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pasos p
        WHERE p.id_nodo_destino IS NULL
           OR (p.posicion > 1 AND p.destino_anterior IS DISTINCT FROM p.id_nodo)
      )
      AND s.id_nodo_actual = coalesce(
        (SELECT p.id_nodo_destino FROM pasos p ORDER BY p.posicion DESC LIMIT 1),
        s.id_nodo_actual
      )
  );
$$;
