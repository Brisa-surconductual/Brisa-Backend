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
el estudiante. Decisión técnica sobre el JSON existente de HU-03:

```json
{
  "texto": "Selecciona tu tipo de dependencia",
  "entrada": { "tipo": "OPCION_UNICA" },
  "captura_perfil": "tipo_dependencia"
}
```

`captura_perfil` admite tipo_dependencia o tipo_craving.
Las opciones clínicas proceden de los enums reales:

- Dependencia: ABSTINENCIA_FISICA, TOLERANCIA.
- Craving: POSITIVO, NEGATIVO.

Solo se permite selección única y modalidad GRUPAL de la sesión.
No se infiere perfil a partir de una selección normal ni de texto libre.
Una recaptura explícita actualiza únicamente su dimensión y fecha, preservando
la otra. `perfil_completo` es GENERATED ALWAYS en PostgreSQL: nunca se escribe
desde Prisma y queda verdadero solo cuando ambas dimensiones están presentes.
El perfil de la sesión y la modalidad fijados al iniciarla no se sustituyen.

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

Ambas migraciones se aplicaron el 6 de noviembre de 2026 en la base de
config/.env y quedaron registradas con Prisma, con checksums coincidentes.
La verificación sobre esa base aprobó 12 comprobaciones y confirmó rollback
con cero registros artificiales restantes. La integración local aprobó 51
comprobaciones; la regresión de chat y seguridad, 320 pruebas (una integración
opcional de RF-24 omitida); y el HTTP administrativo, 203 pruebas. Tras ajustar
la prioridad de obligatoriedad se aprobaron las 106 pruebas específicas del
motor, formatos y HTTP. Estos resultados corresponden a ejecuciones locales,
no a un análisis de SonarCloud ni a un despliegue del código.
