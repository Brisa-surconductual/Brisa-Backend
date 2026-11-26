# RF-39B — Perfil clínico vigente para M05

`ChatModule` exporta el puerto `PerfilClinicoVigentePort`. El módulo de seguimiento importa `ChatModule` e inyecta el puerto definido en `application/ports/perfil-clinico-vigente.port.ts`. La operación `obtener(idUsuario)` recibe el UUID del estudiante. La consulta interna está disponible sin depender de eventos y no requiere una ruta HTTP.

| Campo                          | Valores                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `id_usuario`                   | UUID del estudiante                                                                                  |
| `tipo_dependencia`             | `ABSTINENCIA_FISICA`, `TOLERANCIA` o `PENDIENTE_PERFIL`                                              |
| `tipo_craving`                 | `POSITIVO`, `NEGATIVO` o `PENDIENTE_PERFIL`                                                          |
| `modalidad_terapeutica_activa` | `GRUPAL` o `PERSONALIZADA`                                                                           |
| `estado_perfil_clinico`        | `ACTIVO`, `PENDIENTE` o `NO_CLASIFICADO`                                                             |
| `fecha_clasificacion`          | Última actualización del perfil cuando hay al menos una dimensión registrada. En otro caso es `null` |
| `fuente_clasificacion`         | `CHAT`                                                                                               |

La vista `chat.v_perfil_clinico_vigente` exige un estudiante con registro completo y al menos una sesión activa o completada, según las precondiciones de RF-39B. Lee la asignación vigente de `chat.tipo_terapia` (`fecha_vigencia_hasta IS NULL`) y el perfil persistido por RF-27B. Etiqueta las dimensiones nulas en la consulta y conserva cualquier dimensión ya registrada. La lectura no actualiza el perfil, la sesión ni el historial.

El RF admite dos estados de clasificación incompleta. Se usa `ACTIVO` cuando ambas dimensiones están registradas, `PENDIENTE` cuando falta alguna y existe una sesión activa o una captura parcial, y `NO_CLASIFICADO` si solo hay sesiones completadas y ninguna dimensión se registró.

| Código de dominio           | Equivalencia HTTP | Condición                                                                                    |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `SIN_SESION_CONVERSACIONAL` | 422               | El estudiante no cumple las precondiciones para consultar una sesión                         |
| `VALOR_CLINICO_INVALIDO`    | 400               | Una dimensión o modalidad está fuera de catálogo, o falta la asignación de modalidad vigente |

El RF menciona la modalidad ausente como parte del flujo de clasificación incompleta y define la salida de modalidad con dos valores. El contrato del puerto mantiene esos dos valores. Si una sesión elegible existe pero falta la asignación vigente, el puerto informa el error de dominio para que M05 pueda distinguir el dato inconsistente de una modalidad real.
