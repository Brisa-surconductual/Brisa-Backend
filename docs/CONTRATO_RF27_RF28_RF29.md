# RF-27 / RF-27B / RF-28 / RF-29 — Responder una conversación

## Operación y acceso

`POST /api/chat/sesiones/{idSesion}/respuestas`

Se conserva el alias `/chat/sesiones/{idSesion}/respuestas` usado por el proxy.
Requiere cookie de sesión completa, rol ESTUDIANTE y header `X-CSRF-Token`.
La identidad sale de la sesión autenticada, nunca del body. Responde con
`Cache-Control: no-store`, sin envoltura `data`.

La rama parte de `test` (`a537a4e`). La consulta del nodo actual RF-26
continúa en el PR #47; no se integra ese endpoint en esta rama.
El filtro común coincide con RF-26; ErrorRespuestaChatFilter añade campo
exclusivamente al POST. Al integrar ambos contratos deben alinearse los literales de selección presentados
por RF-26 con OPCION_UNICA y MULTISELECCION del contrato de respuestas.

## Request

```json
{
  "idRespuesta": "uuid-generado-en-cliente",
  "idNodo": "uuid",
  "tipoEntrada": "ESCALA",
  "valor": 7,
  "capturadaEn": "2026-11-06T11:49:00-05:00",
  "conectividad": "EN_LINEA"
}
```

Los campos son obligatorios; `valor` puede ser null cuando lo permite la
entrada y su regla. `capturadaEn` debe incluir fecha, hora y zona horaria.
Se conserva el valor sin coerción, recorte ni reordenamiento.

| tipoEntrada       | valor                   |
| ----------------- | ----------------------- |
| OPCION_UNICA      | string                  |
| MULTISELECCION    | string[] sin duplicados |
| ESCALA / NUMERICO | number finito           |
| FECHA_HORA        | string ISO 8601         |
| BOOLEANO          | boolean                 |
| TEXTO_LIBRE       | string                  |
| CONTINUAR         | null                    |

Este endpoint recibe respuestas en línea; no implementa lotes offline de RF-35.
El reloj del cliente se usa para la captura y el del servidor para actividad,
estado y finalización de la sesión.

## Respuesta 200

```json
{
  "idRespuesta": "uuid",
  "resultado": "VALIDA",
  "transicion": {
    "idNodoOrigen": "uuid",
    "idNodoDestino": "uuid",
    "esTerminal": false
  },
  "estadoSesion": "ACTIVA"
}
```

Solo se selecciona un destino por operación. Un destino sin salidas del flujo
es terminal: se conserva como nodo actual, se registra fecha de finalización y
la sesión queda COMPLETADA. Una sesión ACTIVA ubicada ya en un nodo sin
salidas rechaza nuevas respuestas con NODO_TERMINAL. Leer el último mensaje
corresponde a RF-26; no requiere enviar otra respuesta.

## Configuración y validación

El nodo define `contenido.entrada.tipo` o su nombre histórico
`contenido.entrada.tipo_entrada`. Los valores históricos SELECCION_UNICA y
SELECCION_MULTIPLE se reconocen en la configuración y se normalizan a
OPCION_UNICA y MULTISELECCION. El request utiliza los literales nuevos.

Una pregunta sin configuración es un error del árbol; no habilita texto libre.
Un mensaje intermedio sin entrada usa CONTINUAR, con una regla no obligatoria
y una transición explícita que admita null. CONTINUAR también puede configurarse
de forma explícita en la entrada.

Se respetan min/max, paso, precisión, opciones, límites de selección y
maxCaracteres. Se conservan los campos históricos de palabras y formato
FECHA/HORA cuando están expresamente configurados. Las cadenas se limitan a
8192 caracteres y las multiselecciones a 100 elementos.

Las reglas reutilizables de HU-03 aportan obligatoriedad, tipo de dato,
límites numéricos, regex y valores permitidos. Null, texto vacío y selección
vacía representan ausencia; 0 y false son respuestas presentes.
Los regex se ejecutan como datos, sin interpolación, con un límite de patrón
de 4096 caracteres y tiempo máximo de 500 ms.

Cada transición se valida con su regla y se evalúa por orden_evaluacion
ascendente. Una rama no obliga a satisfacer las opciones de otra rama.
La primera ruta válida cuya condición coincide es la elegida.

| Operador  | Condición                             | Interpretación                                     |
| --------- | ------------------------------------- | -------------------------------------------------- |
| IGUALDAD  | {"valor": 7}                          | Igualdad estricta, sin coerción                    |
| RANGO     | {"min": 1, "max": 10}                 | Límites inclusivos                                 |
| CATEGORIA | {"valores": ["a", "b"]}               | Coincide un valor o un elemento de multiselección  |
| IGUALDAD  | {"campo": "es_valida", "valor": true} | Continúa después de validar, útil para texto libre |

La condición explícita de validez es una decisión técnica sobre el JSON
existente; no añade operadores ni convierte una condición vacía en ruta
predeterminada. Se conserva la igualdad escalar histórica.
Sin una ruta aplicable se responde SIN_TRANSICION, sin guardar ni avanzar.

## Captura clínica RF-27B

La designación del nodo es configuración del árbol, no un campo enviado por
el estudiante. El contrato interno RF-27B se activa mediante `contenido.capturaPerfil`:

```json
{
  "texto": "Selecciona tu tipo de dependencia",
  "entrada": { "tipo": "OPCION_UNICA" },
  "capturaPerfil": { "dimension": "TIPO_DEPENDENCIA" }
}
```

Las dimensiones son `TIPO_DEPENDENCIA` y `TIPO_CRAVING`. Como decisión técnica
sobre el JSON del nodo, se admite el objeto anterior o el literal de dimensión
directamente en `capturaPerfil`. La lectura conserva el formato anterior
`captura_perfil: "tipo_dependencia" | "tipo_craving"`, sin modificar árboles
persistidos. Si ambos formatos están presentes, deben designar la misma dimensión.
Las opciones clínicas proceden de los enums reales:

- Dependencia: ABSTINENCIA_FISICA, TOLERANCIA.
- Craving: POSITIVO, NEGATIVO.

Solo se permite selección única y modalidad GRUPAL de la sesión.
No se infiere perfil a partir de una selección normal ni de texto libre.
Este contrato conserva el primer valor de cada dimensión. Una captura posterior,
incluso con otro valor válido, devuelve `aplicado: false` y no modifica el valor
ni sus fechas; la respuesta se procesa y el flujo continúa normalmente.
Esto sustituye el comportamiento de recaptura de la implementación anterior.
El RF original contempla una actualización explícita mediante nodos de recaptura
o corrección administrativa; esa operación no está definida por este contrato
y no se habilita automáticamente en un nodo de captura ordinario.

`perfil_completo` es GENERATED ALWAYS en PostgreSQL: nunca se escribe
desde Prisma y queda verdadero solo cuando ambas dimensiones están presentes.
El perfil de la sesión y la modalidad fijados al iniciarla no se sustituyen.

El puerto `PerfilClinicoRepository.capturarDimension` recibe internamente:

```json
{
  "idUsuario": "uuid",
  "idSesion": "uuid",
  "idNodo": "uuid",
  "dimension": "TIPO_DEPENDENCIA",
  "valor": "ABSTINENCIA_FISICA",
  "modalidadSesion": "GRUPAL"
}
```

Su resultado no se añade a la respuesta pública del POST:

```json
{
  "aplicado": true,
  "dimension": "TIPO_DEPENDENCIA",
  "valorVigente": "ABSTINENCIA_FISICA",
  "perfilCompleto": false
}
```

Se ejecuta con el cliente Prisma de la misma transacción del POST, después de
validar la respuesta y el destino y antes de confirmar la interacción. El usuario,
sesión y nodo proceden del contexto ya autenticado y verificado. No se crea un
endpoint independiente. Las fechas clínicas corresponden a la primera captura
aceptada por el servidor; `capturadaEn` del POST permanece en los registros de
respuesta e historial.

La persistencia usa `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE` para completar
únicamente dimensiones nulas. El bloqueo de fila de PostgreSQL impide sobrescribir
el primer valor incluso entre sesiones concurrentes. La segunda dimensión conserva
la primera y su fecha; una captura ignorada no actualiza `fecha_actualizacion`.
No requiere cambios de esquema ni migraciones nuevas.

Errores propagados por el POST:

| HTTP | Código                  | Efecto                                               |
| ---- | ----------------------- | ---------------------------------------------------- |
| 400  | VALOR_NO_PERMITIDO      | Valor ajeno a la dimensión; sin escritura ni avance  |
| 409  | CAPTURA_FUERA_DE_GRUPAL | Se usa la modalidad de la sesión, sin captura        |
| 500  | ERROR_PERFIL            | Fallo de persistencia; rollback de toda la respuesta |

La integración de RF-27B está encadenada a `feat/chat-respuestas-rf27-rf28-rf29`,
que aporta el POST y sus dos migraciones. El destino final es `test`; esta corrección
no integra ni modifica esa rama ni elimina la dependencia ya declarada de RF-26.

## Idempotencia, concurrencia y atomicidad

`idRespuesta` se guarda como PK de `chat.respuestas`. El resultado confirmado
se conserva en `resultado_procesamiento`; la interacción interna tiene su
propio UUID. Repetir el mismo idRespuesta de la misma sesión responde 200 con
el resultado original, incluso tras otros avances o completar la sesión.
No se vuelve a validar, capturar el perfil, guardar historial ni avanzar.

El cliente debe generar un UUID nuevo para una nueva respuesta. El UUID no
permite consultar resultados de otra sesión o usuario. Una colisión entre
sesiones devuelve NODO_DESACTUALIZADO sin revelar el resultado ajeno.

La transacción bloquea sesión y estado antes de leer el puntero, y serializa
el idRespuesta. Respuestas distintas simultáneas a un mismo nodo solo pueden
avanzar una vez. Respuesta, resultado original, interacción, historial, perfil
y estado se confirman en una única transacción. Cualquier fallo revierte todas
las escrituras, incluido un perfil capturado antes de fallar el historial.

## Errores

```json
{
  "statusCode": 400,
  "codigo": "FUERA_DE_RANGO",
  "mensaje": "El valor ingresado está fuera del rango permitido.",
  "campo": "valor"
}
```

| HTTP | codigo                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| 400  | TIPO_ENTRADA_NO_PERMITIDO, RESPUESTA_OBLIGATORIA, TIPO_DATO_INVALIDO, FUERA_DE_RANGO, FORMATO_INCORRECTO, VALOR_NO_PERMITIDO |
| 401  | Autenticación existente                                                                                                      |
| 403  | CSRF, rol o alcance insuficiente                                                                                             |
| 404  | SESION_NO_ENCONTRADA                                                                                                         |
| 409  | NODO_TERMINAL, NODO_DESACTUALIZADO, SESION_NO_ACTIVA, CAPTURA_FUERA_DE_GRUPAL                                                |
| 500  | SIN_TRANSICION, DESTINO_INVALIDO, ERROR_PERFIL                                                                               |

Los errores de dato llevan campo valor; el tipo declarado señala tipoEntrada.
Los errores de transporte/DTO y los fallos inesperados conservan el mismo
sobre; codigo puede ser null. Nunca se expone el mensaje privado del driver.
Un resultado histórico sin snapshot no se inventa ni provoca un nuevo avance.

## Migraciones y verificación

- 20261105220000_catalogos_respuestas_rf27: catálogos iniciales, preservando
  registros y UUID existentes.
- 20261106220000_resultado_respuesta_idempotente: columna JSON nullable y los
  literales nuevos OPCION_UNICA, MULTISELECCION, CONTINUAR y EN_LINEA.
- No se modifica la columna generada del perfil, sus enums, la auditoría
  administrativa ni las restricciones existentes.
- La base del env utiliza 0000_baseline_estado_actual. No se reaplica el
  historial anterior: las migraciones autorizadas se ejecutan como SQL
  versionado y se registran mediante Prisma migrate resolve.

La integración local usa una base vacía y desechable, verifica preservación de
datos, FKs, capturas clínicas concurrentes, reenvíos y rollback ante errores.
La prueba de la base del proyecto utiliza fixtures artificiales dentro de una
transacción que se revierte y comprueba que no quedan registros de prueba.
No sustituye una prueba visual del frontend ni la integración pendiente de RF-26.

Resultados de la intervención anterior RF-27/28/29: ambas migraciones se
aplicaron el 6 de noviembre de 2026 en la base de
config/.env y quedaron registradas con Prisma, con checksums coincidentes.
La verificación sobre esa base aprobó 12 comprobaciones y confirmó rollback
con cero registros artificiales restantes. La integración local aprobó 51
comprobaciones; la regresión de chat y seguridad, 320 pruebas (una integración
opcional de RF-24 omitida); y el HTTP administrativo, 203 pruebas. Tras ajustar
la prioridad de obligatoriedad se aprobaron las 106 pruebas específicas del
motor, formatos y HTTP. Estos resultados corresponden a ejecuciones locales,
no a un análisis de SonarCloud ni a un despliegue del código.

Verificación de la corrección RF-27B, ejecutada el 6 de noviembre de 2026:

- 143 pruebas específicas aprobadas (políticas clínicas, motor, formato y HTTP).
- 217 pruebas de regresión de chat y seguridad aprobadas; una integración
  opcional de RF-24 omitida al no habilitar su configuración independiente.
- 62 comprobaciones de integración con PostgreSQL local aprobadas, incluyendo
  el resultado exacto del puerto, conservación del valor y fechas originales,
  capturas concurrentes de la misma dimensión, avance desde sesiones diferentes,
  idempotencia, rechazo de acceso ajeno y rollback ante fallos de perfil e historial.
- La base local se detuvo limpiamente al terminar. Esta corrección no ejecutó
  escrituras ni migraciones sobre Supabase.
