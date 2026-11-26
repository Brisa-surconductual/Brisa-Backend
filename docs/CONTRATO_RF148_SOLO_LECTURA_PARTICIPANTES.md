# RF-148 — Solo lectura de datos de participantes

## Estado

APROBADA. Implementación en `feat/administrativo-solo-lectura-rf148`.

## Operación y acceso

El middleware se ejecuta antes del controlador. Ante un `POST`, `PUT`, `PATCH`
o `DELETE` sobre un recurso de participante, verifica el rol usando la sesión
de autenticación vigente de BRISA. El rol `ADMINISTRATIVO` recibe HTTP 403.
Las consultas, las escrituras propias de configuración o cohortes y las
solicitudes de otros roles siguen su control de acceso habitual.

El registro incluye los recursos de Chat bajo `/chat/sesiones`,
`/chat/admin/sesiones`, `/chat/me`, `/chat/sos` y `/chat/errores-cliente`.
La configuración de árboles, taxonomía y modalidad del programa conserva su
política vigente. La modalidad es configuración del programa (RF-25B).

Los prefijos `/diario`, `/seguimiento`, `/gamificacion` y `/notificaciones`
coinciden con los que reconoce el frontend de M08. Los controladores de esos
módulos aún no están en `develop`. Sus contratos deben verificar la
clasificación de las rutas al integrarse, especialmente si exponen configuración
además de datos de participantes.

Un `GET` administrativo sobre estos recursos con cuerpo o indicaciones de
sobrescritura de método (`override`, `_method` o `X-HTTP-Method-Override`)
responde 400 con `codigo: PARAMETRO_INVALIDO`, conforme al flujo alterno FA4.

## Respuesta de bloqueo

```json
{
  "status": 403,
  "codigo": "ESCRITURA_NO_PERMITIDA",
  "mensaje": "Esta información es de solo lectura para el rol administrativo."
}
```

La denegación no ejecuta la operación de negocio ni actualiza la actividad de
la sesión. La consulta de identidad y la inserción en la bitácora de RF-123
son las únicas operaciones de base de datos propias del bloqueo. La bitácora
registra `INTENTO_ESCRITURA_BLOQUEADO` con estado `DENEGADA`, método y ruta
sin cadena de consulta. El middleware emite un log WARN. Si falla la
bitácora, el intento sigue bloqueado.

## Trazabilidad

- Fuente funcional: RF-148, hoja «MO8- Administrativo» de la especificación de
  requerimientos. Auditoría: RF-123.
- Verificación: colección `solo-lectura-rf148.postman_collection.json` en
  `test/administrativo/postman/`, ejecutada por el workflow `Postman RF-148`
  con PostgreSQL desechable.
- El rol PostgreSQL `admin_lectura` corresponde a la evolución (b) descrita por la HU.
