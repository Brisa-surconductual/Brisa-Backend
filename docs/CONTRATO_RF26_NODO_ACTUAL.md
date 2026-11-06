# RF-26 — Presentar el nodo actual

`GET /api/chat/sesiones/{idSesion}/nodo-actual`, sin body.

Se conserva `/chat/sesiones/{idSesion}/nodo-actual` como alias para el proxy que
retira el prefijo `/api`. Ambas rutas entregan el mismo contrato, sin `data`.
No se modifica el prefijo global de otras operaciones.

Requiere sesión completa y rol ESTUDIANTE mediante los guards existentes.
La identidad procede de la cookie; nunca del body o query. La sesión debe
pertenecer al usuario autenticado. La respuesta usa `Cache-Control: no-store`.

## Respuesta 200

```json
{
  "idSesion": "uuid",
  "estadoSesion": "ACTIVA",
  "nodo": {
    "idNodo": "uuid",
    "tipoNodo": "PREGUNTA",
    "orden": 4,
    "esTerminal": false,
    "bloques": [
      { "orden": 1, "tipo": "TEXTO", "texto": "Pregunta" },
      { "orden": 2, "tipo": "INSTRUCCION", "texto": "Instrucciones" },
      {
        "orden": 3,
        "tipo": "IMAGEN",
        "url": "https://url-firmada",
        "expiraEn": "2026-11-06T17:10:00.000Z",
        "mimeType": "image/webp",
        "textoAlternativo": "Descripción",
        "duracionSegundos": null
      }
    ],
    "entrada": {
      "tipo": "ESCALA",
      "obligatorio": true,
      "min": 1,
      "max": 10,
      "paso": 1,
      "opciones": null,
      "etiquetas": { "min": "Nada", "max": "Muchísimo" },
      "maxCaracteres": null
    }
  }
}
```

`estadoSesion` refleja el estado persistido; leer una sesión PAUSADA o COMPLETADA
no la reactiva. `orden` conserva null cuando no fue configurado en la BD.
`esTerminal` indica ausencia de transiciones del nodo dentro de su flujo; no
ejecuta condiciones ni completa la sesión. Un mensaje sin entrada devuelve
`entrada: null`. No se exponen perfil clínico, otros nodos ni claves de S3.

## Fuente de bloques y entrada

La configuración continúa almacenada en `chat.nodos.contenido` y se adapta al
contrato al leer, sin reescribir el JSON ni necesitar una migración.

- `contenido.bloques`: bloques con orden y tipo; se presentan ordenados sin
  alterar el arreglo almacenado. Los tipos admitidos son TEXTO, INSTRUCCION,
  IMAGEN, VIDEO, GIF, AUDIO y DOCUMENTO.
- Compatibilidad con contenido anterior: `texto`, `instrucciones`, `multimedia`.
  Se conserva el texto literalmente y el orden de la lista multimedia.
- `contenido.entrada`: admite `tipo` o el nombre histórico `tipo_entrada`.
  ESCALA, NUMERICO, SELECCION_UNICA, SELECCION_MULTIPLE, FECHA_HORA, BOOLEANO y
  TEXTO_LIBRE se presentan con los campos del contrato. No se infiere un tipo
  de entrada a partir de una regla de validación.
- Las reglas de las salidas aportan obligatoriedad, límites y opciones cuando
  no están descritos en la configuración. No se recuperan ni ejecutan regex,
  validadores de respuestas o condiciones de transición. Para varias rutas,
  los límites agregados son una ayuda de presentación; la validación exacta
  sigue siendo responsabilidad de RF-28.

Un objeto vacío, JSON null o ausencia de bloques presentables responde 500.
`jsonb NOT NULL` evita SQL NULL, pero no impide esos valores vacíos.

## Recursos privados y compatibilidad con cronograma

Un bloque privado se configura con tipo, orden y `idRecurso` o
`claveAlmacenamiento` (también se admiten sus nombres históricos snake_case).
Ejemplo de JSON almacenado:

```json
{
  "bloques": [
    { "orden": 1, "tipo": "TEXTO", "texto": "Observa el ejercicio" },
    { "orden": 2, "tipo": "VIDEO", "idRecurso": "uuid-del-recurso" }
  ]
}
```

La referencia debe existir entre los recursos del contenido asociado al nodo y
estar asignada al módulo CHAT activo. El campo histórico
`nodos.id_contenido_cronograma` referencia realmente `cronograma.contenidos`.
No se firma una clave arbitraria recibida del estudiante o ajena a ese contenido.
Si el JSON anterior no define bloques y no incluye elementos multimedia (también
si la lista está vacía), se incorporan los recursos asociados en su orden de
catálogo, después del texto y las instrucciones.

Cada consulta firma una URL GET nueva usando el bucket y cliente S3 existentes.
`AWS_S3_READ_EXPIRATION_SECONDS` es opcional: 300 segundos por defecto, entre
60 y 3600. `expiraEn` corresponde al vencimiento real de la firma, en UTC.
No se persisten firmas ni se suben o eliminan archivos durante esta lectura.
Distintos estudiantes autorizados pueden acceder al mismo recurso educativo
desde sus respectivas sesiones, sin duplicar el archivo.

Las URLs S3 firmadas guardadas por versiones anteriores solo se renuevan si su
clave corresponde a un recurso autorizado del contenido asociado. Una firma
antigua sin esa correspondencia responde contenido no disponible.

Los enlaces HTTPS públicos asociados por el editor se conservan con
`expiraEn: null` si no tienen vencimiento. Un enlace externo vencido sin una
referencia renovable responde contenido no disponible. El servidor no descarga
URLs externas para producir esta respuesta. La representación visual del
componente continúa siendo responsabilidad del frontend.

## Errores

```json
{
  "statusCode": 404,
  "codigo": "SESION_NO_ENCONTRADA",
  "mensaje": "No se pudo recuperar el contenido del chat."
}
```

| HTTP | codigo                     | Caso                                                                    |
| ---- | -------------------------- | ----------------------------------------------------------------------- |
| 401  | null o código del guard    | No autenticado                                                          |
| 403  | null o código del guard    | Rol o alcance insuficiente; se conserva la política de acceso existente |
| 404  | SESION_NO_ENCONTRADA       | Sesión inexistente o ajena                                              |
| 404  | NODO_INEXISTENTE           | Puntero nulo, nodo inexistente o de otro flujo                          |
| 409  | SESION_ERROR_CONFIGURACION | Sesión en ERROR_CONFIGURACION                                           |
| 500  | CONTENIDO_NO_DISPONIBLE    | Contenido vacío, recurso no disponible o fallo de lectura/firma         |

Un UUID inválido responde 400 con el mismo sobre. El filtro está aplicado a este
controlador y es reutilizable para los otros contratos del estudiante; no cambia
el manejo global de errores administrativos o la autenticación.

## Distribución de responsabilidades y verificación

- El caso de uso comprueba sesión y pertenencia del nodo y coordina la lectura.
- Los servicios de aplicación preparan la respuesta, entrada y recursos.
- La política de bloques adapta y ordena la representación sin mutar el JSON.
- Los adaptadores de infraestructura solo consultan Prisma o firman GET de S3.
- No se inicia, reanuda, valida una respuesta, ejecuta una transición ni guarda
  estado conversacional durante esta operación. RF-24 conserva su respuesta.

La integración local usa PostgreSQL desechable y `SET TRANSACTION READ ONLY`,
comparando snapshots antes y después. La firma del SDK se prueba sin descargas,
subidas ni cambios en S3. Estas pruebas no sustituyen la reproducción del
historial completo de migraciones ni una prueba visual de frontend.
