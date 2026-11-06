# RF-26 — Lectura del nodo actual

`GET /chat/sesiones/:id_sesion/nodo-actual`

Requiere sesión de estudiante con alcance completo. El propietario se obtiene
de la autenticación; nunca del cliente. Una sesión ajena se informa como no
encontrada. `id_sesion` debe ser UUID. Es una lectura y no exige token CSRF.

Respuesta `200`, con `Cache-Control: no-store`:

```json
{
  "data": {
    "nodo_actual": {
      "id_nodo": "uuid",
      "tipo_nodo": "MENSAJE",
      "contenido": {
        "texto": "Contenido almacenado",
        "instrucciones": "Instrucciones almacenadas",
        "multimedia": []
      },
      "es_nodo_inicial": false,
      "orden": 2
    }
  }
}
```

El JSON de ejemplo no impone campos obligatorios a `contenido`. Se entrega
íntegro, sin recortar texto ni reordenar recursos. La posición se toma de
`chat.sesiones.id_nodo_actual`, no del primer nodo, del orden ni del último
árbol publicado. Se comprueba la pertenencia al flujo de esa sesión.

Se reutiliza la proyección de nodo que ya devuelve RF-24. El envoltorio `data`
mantiene la convención del backend de `test`; el borrador del frontend
`docs/M03/M03_contrato_api_estudiante.md`, sección 4, omite ese envoltorio.
No se incorpora aquí `entrada` derivada de reglas: corresponde a RF-27/RF-28.

| HTTP | Código                         | Situación                                           |
| ---- | ------------------------------ | --------------------------------------------------- |
| 400  | Formato de NestJS              | UUID inválido                                       |
| 401  | Autenticación existente        | Sin sesión de acceso válida                         |
| 403  | Autorización existente         | Rol o alcance no permitido                          |
| 404  | `SESION_NO_ENCONTRADA`         | Sesión inexistente, ajena o sin estado disponible   |
| 404  | `NODO_NO_ENCONTRADO`           | Sin nodo actual, nodo inexistente o fuera del flujo |
| 409  | `SESION_ERROR_CONFIGURACION`   | Sesión conversacional en error de configuración     |
| 500  | `CONTENIDO_NODO_NO_DISPONIBLE` | Contenido nulo o fallo de lectura                   |

Las sesiones pausadas y completadas conservan su estado al consultar su último
nodo. No se actualizan fechas conversacionales, historial, interacciones,
respuestas ni auditoría de árboles. La actividad de la sesión de acceso sigue
siendo responsabilidad del guard de autenticación existente.

Dependencias disponibles en `test`: RF-24 inicializa y conserva el puntero al
nodo; RF-25 administra sus datos. RF-26 no ejecuta RF-27, RF-28 ni RF-29.

No necesita migraciones. `jsonb NOT NULL` impide SQL `NULL`, pero no `{}` ni el
valor JSON `null`. El objeto vacío se conserva sin añadir validaciones de
negocio; JSON `null` se informa como contenido no disponible.
