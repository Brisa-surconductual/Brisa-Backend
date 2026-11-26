-- =====================================================================
-- Migración: recrear_funciones_triggers_bd
-- 1. 21 funciones (usuario: 2, cronograma: 14, chat: 5)
-- 2. Vista cronograma.v_contenidos_estado (depende de fn_estado_contenido)
-- 3. 14 triggers entregados por el equipo
-- 4. 4 triggers inferidos de chat (pendientes de confirmar)
-- Idempotente (CREATE OR REPLACE / DROP TRIGGER IF EXISTS). Rol dba. UTF-8 sin BOM.
-- =====================================================================

-- =====================================================================
-- 1. FUNCIONES · dependencias primero
--    (fn_ubicacion -> fn_contenido_vigente -> fn_informacion)
-- =====================================================================

-- ---------------------------------------------------------------------
-- ESQUEMA usuario
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION usuario.fn_actualizar_consentimiento_vigente()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.vigente = TRUE THEN


UPDATE usuario.usuarios
SET estado_registro = 'PENDIENTE_CONSENTIMIENTO'
WHERE id_consentimiento IN (
    SELECT id_consentimiento
    FROM usuario.consentimientos
    WHERE vigente = TRUE
      AND id_consentimiento IS DISTINCT FROM NEW.id_consentimiento
    )
    AND estado_registro = 'REGISTRO_COMPLETO';

UPDATE usuario.consentimientos
SET vigente = FALSE
WHERE vigente = TRUE
  AND id_consentimiento IS DISTINCT FROM NEW.id_consentimiento;

END IF;

RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION usuario.fn_sincronizar_estado_consentimiento()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN

    IF NEW.estado_registro = 'PENDIENTE_CONSENTIMIENTO' THEN
        NEW.consentimiento_aceptado = FALSE;
END IF;


RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- ESQUEMA cronograma
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cronograma.fn_estado_contenido(timestamp with time zone, timestamp with time zone)
 RETURNS cronograma.estado_contenido_enum
 LANGUAGE sql
 STABLE
AS $function$
SELECT CASE
           WHEN CURRENT_TIMESTAMP < $1
               THEN 'PROGRAMADO'::cronograma.estado_contenido_enum
           WHEN CURRENT_TIMESTAMP >= $2
               THEN 'FINALIZADO'::cronograma.estado_contenido_enum
           ELSE 'ACTIVO'::cronograma.estado_contenido_enum
           END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_ubicacion_temporal_usuario(p_id_usuario uuid, p_fecha_calculo timestamp with time zone DEFAULT CURRENT_TIMESTAMP)
 RETURNS TABLE(id_usuario uuid, id_cronograma_usuario uuid, id_cronograma uuid, id_unidad_temporal uuid, nombre_unidad character varying, orden_unidad integer, fecha_calculo timestamp with time zone, tiempo_efectivo_transcurrido_segundos double precision, cronograma_finalizado boolean, mensaje text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'cronograma', 'usuario'
AS $function$
DECLARE
v_id_cronograma_usuario uuid;
  v_id_cronograma uuid;
  v_fecha_inicio_usuario timestamptz;
  v_fecha_calculo timestamptz := COALESCE(p_fecha_calculo, CURRENT_TIMESTAMP);
  v_fecha_inicio_plantilla date;
  v_fecha_fin_plantilla date;
  v_tiempo_pausado interval := INTERVAL '0 seconds';
  v_tiempo_efectivo interval := INTERVAL '0 seconds';
  v_id_unidad_temporal uuid;
  v_nombre_unidad varchar(150);
  v_orden_unidad integer;
  v_cronograma_finalizado boolean := false;
BEGIN
SELECT
    asignacion.id_cronograma_usuario,
    asignacion.id_cronograma,
    asignacion.fecha_inicio_usuario
INTO
    v_id_cronograma_usuario,
    v_id_cronograma,
    v_fecha_inicio_usuario
FROM cronograma.cronogramas_usuario AS asignacion
WHERE asignacion.id_usuario = p_id_usuario;

IF NOT FOUND OR v_fecha_inicio_usuario IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf22_fecha_inicio_requerida',
      MESSAGE = 'El usuario no tiene una fecha de inicio registrada en el programa.';
END IF;

SELECT
    MIN(unidad.fecha_inicio),
    MAX(unidad.fecha_fin)
INTO
    v_fecha_inicio_plantilla,
    v_fecha_fin_plantilla
FROM cronograma.unidades_temporales AS unidad
WHERE unidad.id_cronograma = v_id_cronograma;

IF v_fecha_inicio_plantilla IS NULL OR v_fecha_fin_plantilla IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf22_cronograma_sin_unidades',
      MESSAGE = 'El cronograma no cuenta con unidades temporales definidas para realizar el cálculo.';
END IF;

  -- Antes del inicio todavía no existe una unidad vigente. El tiempo efectivo
  -- se mantiene en cero y el cronograma no se considera finalizado.
  IF v_fecha_calculo < v_fecha_inicio_usuario THEN
    RETURN QUERY
SELECT
    p_id_usuario,
    v_id_cronograma_usuario,
    v_id_cronograma,
    NULL::uuid,
    NULL::varchar(150),
    NULL::integer,
    v_fecha_calculo,
    0::double precision,
      false,
      NULL::text;
RETURN;
END IF;

  -- Solo se descuenta la intersección de cada pausa no anulada con el tiempo
  -- ya transcurrido desde el inicio individual del programa.
SELECT COALESCE(
               SUM(
                       LEAST(pausa.fecha_fin_pausa, v_fecha_calculo)
                           - GREATEST(pausa.fecha_inicio_pausa, v_fecha_inicio_usuario)
               ),
               INTERVAL '0 seconds'
       )
INTO v_tiempo_pausado
FROM cronograma.pausas_administrativas AS pausa
WHERE pausa.id_cronograma_usuario = v_id_cronograma_usuario
  AND pausa.estado_pausa <> 'ANULADA'::cronograma.estado_pausa_enum
    AND pausa.fecha_inicio_pausa < v_fecha_calculo
    AND pausa.fecha_fin_pausa > v_fecha_inicio_usuario;

v_tiempo_efectivo := GREATEST(
    v_fecha_calculo - v_fecha_inicio_usuario - v_tiempo_pausado,
    INTERVAL '0 seconds'
  );

SELECT
    unidad.id_unidad_temporal,
    unidad.nombre_unidad,
    unidad.orden_unidad
INTO
    v_id_unidad_temporal,
    v_nombre_unidad,
    v_orden_unidad
FROM cronograma.unidades_temporales AS unidad
WHERE unidad.id_cronograma = v_id_cronograma
  AND v_tiempo_efectivo >=
      ((unidad.fecha_inicio - v_fecha_inicio_plantilla) * INTERVAL '1 day')
  AND v_tiempo_efectivo <
    ((unidad.fecha_fin - v_fecha_inicio_plantilla) * INTERVAL '1 day')
ORDER BY unidad.orden_unidad
    LIMIT 1;

v_cronograma_finalizado := v_tiempo_efectivo >=
    ((v_fecha_fin_plantilla - v_fecha_inicio_plantilla) * INTERVAL '1 day');

RETURN QUERY
SELECT
    p_id_usuario,
    v_id_cronograma_usuario,
    v_id_cronograma,
    v_id_unidad_temporal,
    v_nombre_unidad,
    v_orden_unidad,
    v_fecha_calculo,
    EXTRACT(EPOCH FROM v_tiempo_efectivo)::double precision,
    v_cronograma_finalizado,
    CASE
      WHEN v_cronograma_finalizado
        THEN 'El usuario ha completado la totalidad del cronograma.'
      ELSE NULL
END;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_contenido_vigente_usuario(p_id_usuario uuid, p_fecha_consulta timestamp with time zone DEFAULT CURRENT_TIMESTAMP)
 RETURNS TABLE(id_contenido uuid, id_contenido_cronograma uuid, nombre_contenido character varying, tipo_contenido cronograma.tipo_contenido_enum, id_unidad_temporal uuid, nombre_unidad character varying, orden_unidad integer, orden_contenido integer, fecha_inicio_disponibilidad timestamp with time zone, fecha_fin_disponibilidad timestamp with time zone, estado_disponibilidad cronograma.estado_contenido_enum)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'cronograma'
AS $function$
DECLARE
v_fecha_consulta timestamptz := COALESCE(
    p_fecha_consulta,
    CURRENT_TIMESTAMP
  );
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cronograma.cronogramas_usuario AS asignacion
    WHERE asignacion.id_usuario = p_id_usuario
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf21_cronograma_usuario_no_asignado',
      MESSAGE = 'El usuario no tiene un cronograma asignado.';
END IF;

RETURN QUERY
    WITH ubicacion AS (
    SELECT resultado.*
    FROM cronograma.fn_ubicacion_temporal_usuario(
      p_id_usuario,
      v_fecha_consulta
    ) AS resultado
  ),
  inicio_plantilla AS (
    SELECT MIN(unidad.fecha_inicio) AS fecha_inicio
    FROM cronograma.unidades_temporales AS unidad
    INNER JOIN ubicacion
      ON ubicacion.id_cronograma = unidad.id_cronograma
  ),
  instante_efectivo AS (
    SELECT
      ubicacion.*,
      (inicio_plantilla.fecha_inicio::timestamp AT TIME ZONE 'UTC')
        + (
          ubicacion.tiempo_efectivo_transcurrido_segundos
            * INTERVAL '1 second'
        ) AS fecha_efectiva_plantilla
    FROM ubicacion
    CROSS JOIN inicio_plantilla
  )
SELECT
    contenido.id_contenido,
    programacion.id_contenido_cronograma,
    contenido.nombre_contenido,
    contenido.tipo_contenido,
    unidad.id_unidad_temporal,
    unidad.nombre_unidad,
    unidad.orden_unidad,
    programacion.orden_contenido,
    programacion.fecha_inicio_disponibilidad,
    programacion.fecha_fin_disponibilidad,
    'ACTIVO'::cronograma.estado_contenido_enum
FROM instante_efectivo
         INNER JOIN cronograma.unidades_temporales AS unidad
                    ON unidad.id_unidad_temporal = instante_efectivo.id_unidad_temporal
         INNER JOIN cronograma.contenidos_cronograma AS programacion
                    ON programacion.id_unidad_temporal = unidad.id_unidad_temporal
         INNER JOIN cronograma.contenidos AS contenido
                    ON contenido.id_contenido = programacion.id_contenido
WHERE NOT instante_efectivo.cronograma_finalizado
  AND programacion.fecha_inicio_disponibilidad IS NOT NULL
  AND programacion.fecha_fin_disponibilidad IS NOT NULL
  AND instante_efectivo.fecha_efectiva_plantilla >=
      programacion.fecha_inicio_disponibilidad
  AND instante_efectivo.fecha_efectiva_plantilla <
      programacion.fecha_fin_disponibilidad
ORDER BY
    unidad.orden_unidad,
    programacion.orden_contenido NULLS LAST,
    contenido.id_contenido;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_informacion_temporal_usuario(p_id_usuario uuid, p_fecha_consulta timestamp with time zone DEFAULT CURRENT_TIMESTAMP)
 RETURNS TABLE(ubicacion_id_usuario uuid, ubicacion_id_cronograma_usuario uuid, ubicacion_id_cronograma uuid, ubicacion_id_unidad_temporal uuid, ubicacion_nombre_unidad character varying, ubicacion_orden_unidad integer, fecha_calculo timestamp with time zone, tiempo_efectivo_transcurrido_segundos double precision, cronograma_finalizado boolean, mensaje text, contenido_id_contenido uuid, contenido_id_contenido_cronograma uuid, contenido_nombre_contenido character varying, contenido_tipo_contenido cronograma.tipo_contenido_enum, contenido_id_unidad_temporal uuid, contenido_nombre_unidad character varying, contenido_orden_unidad integer, contenido_orden_contenido integer, contenido_fecha_inicio_disponibilidad timestamp with time zone, contenido_fecha_fin_disponibilidad timestamp with time zone, contenido_estado_disponibilidad cronograma.estado_contenido_enum)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'cronograma'
AS $function$
DECLARE
v_fecha_consulta timestamptz := COALESCE(
    p_fecha_consulta,
    CURRENT_TIMESTAMP
  );
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cronograma.cronogramas_usuario AS asignacion
    INNER JOIN cronograma.cronogramas AS cronograma
      ON cronograma.id_cronograma = asignacion.id_cronograma
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
    WHERE asignacion.id_usuario = p_id_usuario
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      CONSTRAINT = 'rf23_cronograma_activo_no_asignado',
      MESSAGE = 'El usuario no tiene un cronograma activo asignado.';
END IF;

RETURN QUERY
SELECT
    ubicacion.id_usuario,
    ubicacion.id_cronograma_usuario,
    ubicacion.id_cronograma,
    ubicacion.id_unidad_temporal,
    ubicacion.nombre_unidad,
    ubicacion.orden_unidad,
    ubicacion.fecha_calculo,
    ubicacion.tiempo_efectivo_transcurrido_segundos,
    ubicacion.cronograma_finalizado,
    ubicacion.mensaje,
    contenido.id_contenido,
    contenido.id_contenido_cronograma,
    contenido.nombre_contenido,
    contenido.tipo_contenido,
    contenido.id_unidad_temporal,
    contenido.nombre_unidad,
    contenido.orden_unidad,
    contenido.orden_contenido,
    contenido.fecha_inicio_disponibilidad,
    contenido.fecha_fin_disponibilidad,
    contenido.estado_disponibilidad
FROM cronograma.fn_ubicacion_temporal_usuario(
             p_id_usuario,
             v_fecha_consulta
     ) AS ubicacion
         LEFT JOIN LATERAL cronograma.fn_contenido_vigente_usuario(
    p_id_usuario,
    v_fecha_consulta
  ) AS contenido ON TRUE
ORDER BY
    contenido.orden_unidad NULLS LAST,
    contenido.orden_contenido NULLS LAST,
    contenido.id_contenido;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_historial_pausas_administrativas_usuario(p_id_usuario uuid, p_fecha_consulta timestamp with time zone DEFAULT CURRENT_TIMESTAMP)
 RETURNS TABLE(id_pausa uuid, id_usuario uuid, id_cronograma_usuario uuid, fecha_inicio_pausa timestamp with time zone, fecha_fin_pausa timestamp with time zone, motivo_pausa text, id_usuario_administrativo uuid, fecha_registro timestamp with time zone, estado_pausa cronograma.estado_pausa_enum)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'cronograma'
AS $function$
SELECT
    pausa.id_pausa,
    pausa.id_usuario,
    pausa.id_cronograma_usuario,
    pausa.fecha_inicio_pausa,
    pausa.fecha_fin_pausa,
    pausa.motivo_pausa,
    pausa.id_usuario_administrativo,
    pausa.fecha_registro,
    CASE
        WHEN pausa.estado_pausa = 'ANULADA'::cronograma.estado_pausa_enum
        THEN 'ANULADA'::cronograma.estado_pausa_enum
        WHEN pausa.estado_pausa = 'FINALIZADA'::cronograma.estado_pausa_enum
        OR pausa.fecha_fin_pausa <= COALESCE(
            p_fecha_consulta,
            CURRENT_TIMESTAMP
                                    )
    THEN 'FINALIZADA'::cronograma.estado_pausa_enum
      ELSE 'ACTIVA'::cronograma.estado_pausa_enum
END AS estado_pausa
  FROM cronograma.pausas_administrativas AS pausa
  WHERE pausa.id_usuario = p_id_usuario
  ORDER BY
    pausa.fecha_inicio_pausa DESC,
    pausa.fecha_registro DESC,
    pausa.id_pausa;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_bloquear_contenido_al_asociar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
v_id_contenido UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  v_id_contenido := NEW.id_contenido;
  -- Mismo orden de bloqueos que la activación: cronograma y luego contenido.
  PERFORM 1 FROM cronograma.cronogramas c
  JOIN cronograma.unidades_temporales ut ON ut.id_cronograma = c.id_cronograma
  WHERE ut.id_unidad_temporal = NEW.id_unidad_temporal FOR UPDATE OF c;
PERFORM 1 FROM cronograma.contenidos
  WHERE id_contenido = v_id_contenido FOR UPDATE;
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_bloquear_contenidos_al_activar_cronograma()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
     AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    PERFORM 1
    FROM cronograma.contenidos c
    JOIN cronograma.contenidos_cronograma cc ON cc.id_contenido = c.id_contenido
    JOIN cronograma.unidades_temporales ut ON ut.id_unidad_temporal = cc.id_unidad_temporal
    WHERE ut.id_cronograma = NEW.id_cronograma
    ORDER BY c.id_contenido
    FOR UPDATE OF c;
END IF;
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_contenido_bloqueo_cronograma_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cronograma.contenidos_cronograma AS contenido_cronograma
    INNER JOIN cronograma.unidades_temporales AS unidad
      ON unidad.id_unidad_temporal = contenido_cronograma.id_unidad_temporal
    INNER JOIN cronograma.cronogramas AS cronograma
      ON cronograma.id_cronograma = unidad.id_cronograma
    WHERE contenido_cronograma.id_contenido = OLD.id_contenido
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se puede modificar un contenido asociado a un cronograma activo.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_contenido_bloqueo_cronograma_activo';
END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
END IF;

RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_cronograma_usuario_validar_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cronograma.cronogramas AS cronograma
    WHERE cronograma.id_cronograma = NEW.id_cronograma
      AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se puede asignar un cronograma que no esté activo.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_cronograma_usuario_validar_activo';
END IF;

RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_encolar_limpieza_objeto_recurso()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.clave_almacenamiento IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO cronograma.limpieza_objetos_recurso (id_contenido, clave_almacenamiento)
      VALUES (OLD.id_contenido, OLD.clave_almacenamiento)
      ON CONFLICT (clave_almacenamiento) DO NOTHING;
    ELSIF OLD.clave_almacenamiento IS DISTINCT FROM NEW.clave_almacenamiento THEN
      INSERT INTO cronograma.limpieza_objetos_recurso (id_contenido, clave_almacenamiento)
      VALUES (OLD.id_contenido, OLD.clave_almacenamiento)
      ON CONFLICT (clave_almacenamiento) DO NOTHING;
END IF;
END IF;
RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_evento_contenido_inmutable()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Los eventos de contenido publicados son inmutables.'
    USING ERRCODE = '23514',
          CONSTRAINT = 'trg_evento_contenido_inmutable';
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_pausa_validar_rango()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
fecha_inicio_cronograma timestamptz;
  fecha_fin_cronograma timestamptz;
BEGIN
SELECT
    asignacion.fecha_inicio_usuario,
    asignacion.fecha_inicio_usuario
        + ((MAX(unidad.fecha_fin) - MIN(unidad.fecha_inicio)) * INTERVAL '1 day')
INTO fecha_inicio_cronograma, fecha_fin_cronograma
FROM cronograma.cronogramas_usuario AS asignacion
    INNER JOIN usuario.usuarios AS estudiante
ON estudiante.id_usuario = asignacion.id_usuario
    AND estudiante.rol = 'ESTUDIANTE'::usuario.rol_enum
    INNER JOIN cronograma.cronogramas AS cronograma
    ON cronograma.id_cronograma = asignacion.id_cronograma
    INNER JOIN cronograma.unidades_temporales AS unidad
    ON unidad.id_cronograma = cronograma.id_cronograma
WHERE asignacion.id_cronograma_usuario = NEW.id_cronograma_usuario
  AND asignacion.id_usuario = NEW.id_usuario
  AND cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
GROUP BY asignacion.fecha_inicio_usuario;

IF fecha_inicio_cronograma IS NULL OR fecha_fin_cronograma IS NULL THEN
    RAISE EXCEPTION 'El usuario seleccionado no tiene un cronograma activo asignado.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_pausa_validar_rango';
END IF;

  IF NEW.fecha_inicio_pausa < fecha_inicio_cronograma
    OR NEW.fecha_inicio_pausa > fecha_fin_cronograma THEN
    RAISE EXCEPTION 'La fecha de inicio de la pausa debe encontrarse dentro del rango del cronograma activo del usuario.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_pausa_validar_rango';
END IF;

RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
v_id_contenido UUID;
  v_cambia_clave BOOLEAN := false;
BEGIN
  IF TG_TABLE_NAME = 'recursos_contenido' THEN
    IF TG_OP = 'INSERT' THEN
      v_cambia_clave := true;
    ELSIF TG_OP = 'UPDATE' THEN
      v_cambia_clave := NEW.clave_almacenamiento IS DISTINCT FROM OLD.clave_almacenamiento;
END IF;
    IF v_cambia_clave THEN
      IF NEW.clave_almacenamiento IS NOT NULL THEN
          IF EXISTS (SELECT 1 FROM cronograma.limpieza_objetos_recurso
                     WHERE clave_almacenamiento = NEW.clave_almacenamiento) THEN
            RAISE EXCEPTION 'La clave de almacenamiento ya fue retirada.'
              USING ERRCODE = '23514', CONSTRAINT = 'ck_recurso_clave_retirada';
END IF;
END IF;
END IF;
    IF TG_OP = 'DELETE' THEN
      v_id_contenido := OLD.id_contenido;
ELSE
      v_id_contenido := NEW.id_contenido;
END IF;
ELSE
    IF TG_OP = 'DELETE' THEN
SELECT id_contenido INTO v_id_contenido
FROM cronograma.recursos_contenido WHERE id_recurso = OLD.id_recurso;
ELSE
SELECT id_contenido INTO v_id_contenido
FROM cronograma.recursos_contenido WHERE id_recurso = NEW.id_recurso;
END IF;
END IF;

  IF v_id_contenido IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END IF;

  -- Serializa edición de recursos contra asociación/activación.
  PERFORM 1 FROM cronograma.contenidos
  WHERE id_contenido = v_id_contenido FOR UPDATE;

IF EXISTS (
    SELECT 1
    FROM cronograma.contenidos_cronograma cc
    JOIN cronograma.unidades_temporales ut ON ut.id_unidad_temporal = cc.id_unidad_temporal
    JOIN cronograma.cronogramas c ON c.id_cronograma = ut.id_cronograma
    WHERE cc.id_contenido = v_id_contenido
      AND c.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  ) THEN
    RAISE EXCEPTION 'No se pueden modificar recursos asociados a un cronograma activo.'
      USING ERRCODE = '23514', CONSTRAINT = 'trg_recurso_bloqueo_cronograma_activo';
END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION cronograma.fn_recurso_requiere_modulo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
recurso_uuid uuid;
BEGIN
  IF TG_TABLE_NAME = 'recursos_contenido' THEN
    recurso_uuid := NEW.id_recurso;
  ELSIF TG_OP = 'DELETE' THEN
    recurso_uuid := OLD.id_recurso;
ELSE
    recurso_uuid := OLD.id_recurso;
END IF;

  IF EXISTS (
    SELECT 1
    FROM cronograma.recursos_contenido recurso
    WHERE recurso.id_recurso = recurso_uuid
  ) AND NOT EXISTS (
    SELECT 1
    FROM cronograma.recursos_modulos_destino destino
    WHERE destino.id_recurso = recurso_uuid
  ) THEN
    RAISE EXCEPTION 'El recurso debe tener al menos un módulo destino asignado.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'trg_recurso_requiere_modulo';
END IF;

RETURN NULL;
END;
$function$;

-- ---------------------------------------------------------------------
-- ESQUEMA chat
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION chat.fn_archivar_flujo_previo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'PUBLICADO' THEN
UPDATE chat.flujo_conversacion
SET estado = 'ARCHIVADO', fecha_archivado = now()
WHERE estado = 'PUBLICADO'
  AND modalidad = NEW.modalidad
  AND id_flujo <> NEW.id_flujo
  AND (
    (NEW.modalidad = 'GRUPAL')
        OR (NEW.modalidad = 'PERSONALIZADA'
        AND tipo_dependencia = NEW.tipo_dependencia
        AND tipo_craving = NEW.tipo_craving)
    );
NEW.fecha_publicacion := now();
END IF;
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION chat.fn_auditoria_arbol_inmutable()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'La auditoría del árbol conversacional es inmutable';
END;
$function$;

CREATE OR REPLACE FUNCTION chat.fn_bloquear_borrado_flujo_publicado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.estado <> 'BORRADOR' THEN
        RAISE EXCEPTION 'No es posible eliminar un árbol que ha sido publicado. Utilice archivado.'
            USING ERRCODE = 'check_violation';
END IF;
RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION chat.fn_bloquear_edicion_historial()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'El historial de nodos es inmutable (RF-38): no se permite % ', TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$function$;

CREATE OR REPLACE FUNCTION chat.fn_sync_flujo_regla()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
SELECT id_flujo INTO NEW.id_flujo FROM chat.nodos WHERE id_nodo = NEW.id_nodo_origen;
RETURN NEW;
END;
$function$;

-- =====================================================================
-- 2. VISTA dependiente de fn_estado_contenido (RF-15)
--    Un DROP FUNCTION ... CASCADE sobre fn_estado_contenido la elimina.
-- =====================================================================

CREATE OR REPLACE VIEW cronograma.v_contenidos_estado AS
SELECT
    contenido_cronograma.id_contenido_cronograma,
    contenido_cronograma.id_contenido,
    unidad.id_cronograma,
    contenido_cronograma.fecha_inicio_disponibilidad,
    contenido_cronograma.fecha_fin_disponibilidad,
    cronograma.fn_estado_contenido(
            contenido_cronograma.fecha_inicio_disponibilidad,
            contenido_cronograma.fecha_fin_disponibilidad
    ) AS estado_actual
FROM cronograma.contenidos_cronograma AS contenido_cronograma
         INNER JOIN cronograma.unidades_temporales AS unidad
                    ON unidad.id_unidad_temporal = contenido_cronograma.id_unidad_temporal
         INNER JOIN cronograma.cronogramas AS cronograma
                    ON cronograma.id_cronograma = unidad.id_cronograma
WHERE cronograma.estado = 'ACTIVO'::cronograma.estado_cronograma_enum
  AND contenido_cronograma.fecha_inicio_disponibilidad IS NOT NULL
  AND contenido_cronograma.fecha_fin_disponibilidad IS NOT NULL;

-- =====================================================================
-- 3. TRIGGERS (definiciones entregadas por el equipo)
-- =====================================================================

-- ---------------------------------------------------------------------
-- usuario
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sincronizar_estado_consentimiento ON usuario.usuarios;
CREATE TRIGGER trg_sincronizar_estado_consentimiento
    BEFORE INSERT OR UPDATE OF estado_registro ON usuario.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION usuario.fn_sincronizar_estado_consentimiento();

DROP TRIGGER IF EXISTS trg_solo_un_consentimiento_vigente ON usuario.consentimientos;
CREATE TRIGGER trg_solo_un_consentimiento_vigente
    BEFORE INSERT OR UPDATE OF vigente ON usuario.consentimientos
    FOR EACH ROW
    EXECUTE FUNCTION usuario.fn_actualizar_consentimiento_vigente();

-- ---------------------------------------------------------------------
-- cronograma · recursos y limpieza de objetos (outbox S3)
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_recurso_bloqueo_cronograma_activo ON cronograma.recursos_contenido;
CREATE TRIGGER trg_recurso_bloqueo_cronograma_activo
    BEFORE INSERT OR UPDATE OR DELETE ON cronograma.recursos_contenido
    FOR EACH ROW EXECUTE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo();

-- La cola se inserta en la misma transacción, incluidas eliminaciones por cascada.
DROP TRIGGER IF EXISTS trg_encolar_limpieza_objeto_recurso ON cronograma.recursos_contenido;
CREATE TRIGGER trg_encolar_limpieza_objeto_recurso
    AFTER DELETE OR UPDATE OF clave_almacenamiento ON cronograma.recursos_contenido
    FOR EACH ROW EXECUTE FUNCTION cronograma.fn_encolar_limpieza_objeto_recurso();

DROP TRIGGER IF EXISTS trg_recurso_modulo_bloqueo_cronograma_activo ON cronograma.recursos_modulos_destino;
CREATE TRIGGER trg_recurso_modulo_bloqueo_cronograma_activo
    BEFORE INSERT OR UPDATE OR DELETE ON cronograma.recursos_modulos_destino
    FOR EACH ROW EXECUTE FUNCTION cronograma.fn_recurso_bloqueo_cronograma_activo();

-- Un recurso debe terminar la transacción con al menos un módulo destino.
DROP TRIGGER IF EXISTS trg_recurso_requiere_modulo ON cronograma.recursos_contenido;
CREATE CONSTRAINT TRIGGER trg_recurso_requiere_modulo
  AFTER INSERT OR UPDATE ON cronograma.recursos_contenido
                             DEFERRABLE INITIALLY DEFERRED
                             FOR EACH ROW
                             EXECUTE FUNCTION cronograma.fn_recurso_requiere_modulo();

DROP TRIGGER IF EXISTS trg_recurso_requiere_modulo ON cronograma.recursos_modulos_destino;
CREATE CONSTRAINT TRIGGER trg_recurso_requiere_modulo
  AFTER DELETE OR UPDATE ON cronograma.recursos_modulos_destino
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION cronograma.fn_recurso_requiere_modulo();

-- ---------------------------------------------------------------------
-- cronograma · bloqueos de concurrencia y cronograma activo
-- ---------------------------------------------------------------------
-- Al activar un cronograma se bloquean primero, en orden determinista, sus contenidos.
DROP TRIGGER IF EXISTS trg_bloquear_contenidos_al_activar_cronograma ON cronograma.cronogramas;
CREATE TRIGGER trg_bloquear_contenidos_al_activar_cronograma
    BEFORE UPDATE OF estado ON cronograma.cronogramas
    FOR EACH ROW EXECUTE FUNCTION cronograma.fn_bloquear_contenidos_al_activar_cronograma();

-- Una nueva asociación también espera una edición que ya bloquee el contenido.
DROP TRIGGER IF EXISTS trg_bloquear_contenido_al_asociar ON cronograma.contenidos_cronograma;
CREATE TRIGGER trg_bloquear_contenido_al_asociar
    BEFORE INSERT OR UPDATE OF id_contenido, id_unidad_temporal ON cronograma.contenidos_cronograma
    FOR EACH ROW EXECUTE FUNCTION cronograma.fn_bloquear_contenido_al_asociar();

-- RF-152: contenido asociado a un cronograma activo protegido frente a UPDATE y DELETE.
DROP TRIGGER IF EXISTS trg_contenido_bloqueo_cronograma_activo ON cronograma.contenidos;
CREATE TRIGGER trg_contenido_bloqueo_cronograma_activo
    BEFORE UPDATE OR DELETE ON cronograma.contenidos
  FOR EACH ROW
  EXECUTE FUNCTION cronograma.fn_contenido_bloqueo_cronograma_activo();

-- RF-17: no se puede asignar un cronograma inactivo.
DROP TRIGGER IF EXISTS trg_cronograma_usuario_validar_activo ON cronograma.cronogramas_usuario;
CREATE TRIGGER trg_cronograma_usuario_validar_activo
    BEFORE INSERT OR UPDATE OF id_cronograma ON cronograma.cronogramas_usuario
    FOR EACH ROW
    EXECUTE FUNCTION cronograma.fn_cronograma_usuario_validar_activo();

-- RF-15: los eventos de contenido almacenados son inmutables.
DROP TRIGGER IF EXISTS trg_evento_contenido_inmutable ON cronograma.eventos_contenido;
CREATE TRIGGER trg_evento_contenido_inmutable
    BEFORE UPDATE ON cronograma.eventos_contenido
    FOR EACH ROW
    EXECUTE FUNCTION cronograma.fn_evento_contenido_inmutable();

-- RF-22B: la pausa debe caer dentro del rango del cronograma activo del usuario.
DROP TRIGGER IF EXISTS trg_pausa_validar_rango ON cronograma.pausas_administrativas;
CREATE TRIGGER trg_pausa_validar_rango
    BEFORE INSERT OR UPDATE OF id_usuario, id_cronograma_usuario, fecha_inicio_pausa
                     ON cronograma.pausas_administrativas
                         FOR EACH ROW
                         EXECUTE FUNCTION cronograma.fn_pausa_validar_rango();

-- ---------------------------------------------------------------------
-- chat
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_auditoria_arbol_inmutable ON chat.auditoria_arboles;
CREATE TRIGGER trg_auditoria_arbol_inmutable
    BEFORE UPDATE OR DELETE ON chat.auditoria_arboles
  FOR EACH ROW EXECUTE FUNCTION chat.fn_auditoria_arbol_inmutable();

-- =====================================================================
-- 4. TRIGGERS INFERIDOS · PENDIENTE DE CONFIRMAR
--    Sus funciones existen, pero no se entregó su CREATE TRIGGER.
--    Momento y eventos deducidos del cuerpo de cada función.
--    Si no deben existir, eliminar esta sección antes de aplicar.
-- =====================================================================

-- Escribe NEW.fecha_publicacion -> BEFORE. Garantiza un solo árbol publicado
-- por modalidad/combinación de perfil (RF-25C).
DROP TRIGGER IF EXISTS trg_archivar_flujo_previo ON chat.flujo_conversacion;
CREATE TRIGGER trg_archivar_flujo_previo
    BEFORE INSERT OR UPDATE OF estado ON chat.flujo_conversacion
    FOR EACH ROW EXECUTE FUNCTION chat.fn_archivar_flujo_previo();

-- Usa OLD y RETURN OLD -> BEFORE DELETE. Solo se borran árboles en BORRADOR.
DROP TRIGGER IF EXISTS trg_bloquear_borrado_flujo_publicado ON chat.flujo_conversacion;
CREATE TRIGGER trg_bloquear_borrado_flujo_publicado
    BEFORE DELETE ON chat.flujo_conversacion
    FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_borrado_flujo_publicado();

-- RF-38: historial de nodos inmutable (el mensaje usa TG_OP).
DROP TRIGGER IF EXISTS trg_bloquear_edicion_historial ON chat.historial_nodos;
CREATE TRIGGER trg_bloquear_edicion_historial
    BEFORE UPDATE OR DELETE ON chat.historial_nodos
  FOR EACH ROW EXECUTE FUNCTION chat.fn_bloquear_edicion_historial();

-- Copia id_flujo desde el nodo origen. Complementa las FK compuestas (D5):
-- el backend no necesita enviar id_flujo al crear una transición.
DROP TRIGGER IF EXISTS trg_sync_flujo_regla ON chat.reglas_nodos;
CREATE TRIGGER trg_sync_flujo_regla
    BEFORE INSERT OR UPDATE ON chat.reglas_nodos
                         FOR EACH ROW EXECUTE FUNCTION chat.fn_sync_flujo_regla();