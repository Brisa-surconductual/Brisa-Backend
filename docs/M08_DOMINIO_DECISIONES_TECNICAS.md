# M-8 (Administrativo) — Reorganización de la capa de dominio: decisiones técnicas

> Documento de decisiones técnicas (sección 8 de [`SDD.md`](SDD.md)). No es un contrato de comportamiento: **ningún endpoint, respuesta, mensaje ni regla observable cambia**. Rama: `fix/RefactorizarModuloAdministrativo`.

## 1. Motivo

El dominio de `administrativo` era una carpeta plana (`domain/*.ts`) que mezclaba, en un mismo archivo, tipos-enumeración, interfaces de lectura, entidades, reglas puras y utilidades de validación. Se alinea con la anatomía canónica de la sección 2.3.3 de `SDD.md`, tomando como referencia el módulo `chat`.

## 2. Estructura resultante

```text
domain/
├── entities/<feature>/*.entity.ts   # entidades + reglas puras de esa entidad (con su *.spec.ts)
├── enums/*.enum.ts                  # un archivo por enumeración / catálogo de literales
├── exceptions/*.exception(s).ts     # excepciones de dominio (sin Nest ni HTTP) + index.ts
├── results/*.ts                     # interfaces que no son contratos (contextos, envolturas, modelos de lectura)
└── value-objects/*.vo.ts            # reglas reutilizables que consumen las funciones de dominio
```

| Carpeta | Contenido |
| --- | --- |
| `entities/` | `auditoria/registro-auditoria`, `cohorte/cohorte` (+ `validarFechasCohorte`, `validarTransicionCohorte`), `participante-cohorte/participante-cohorte`, `vistas-agregadas/vista-{conductual,narrativa,notificaciones}` (+ proyecciones), `dashboard-principal/dashboard-principal` (+ `ensamblarDashboard`, `dashboardSinCohorte`), `evolucion-temporal/evolucion-temporal` (+ `construirEvolucionTemporal`), `exportacion-cohorte/exportacion-cohorte` (+ `generarCsvCohorte`, `accionExportacionCohorte`). |
| `enums/` | `AccionAdministrativa`, `EstadoAccion`, `RecursoAuditado`, `EstadoCohorte` (+ `ESTADOS_COHORTE`), `OperacionCohorte`, `EstadoParticipanteCohorte`, `OperacionParticipanteCohorte`, `TipoVistaAgregada`, `EstadoVistaAgregada`, `EstadoAgregacion`, `MotivoSinDatos`, `EstadoSnapshotAgregado`, `EstadoDashboard`, `NivelProgreso` (+ `NIVELES_PROGRESO`), `FaseNarrativa` (+ `FASES_NARRATIVAS`), `COLUMNAS_EXPORTACION_COHORTE`. |
| `results/` | `ContextoAuditoria`, `AccionAuditable`/`EventoAuditoria`/`DetalleAuditoria`, `EntradaBitacora`, `CohorteConsultada`, `VistaAgregada<T>`/`DatosVistaAgregada`, `VistaConductualExportable`, `DashboardPrincipal`/`VistasDashboard`, `EvolucionTemporal`. |
| `value-objects/` | `objeto-plano` (`esObjeto`), `fecha-agregado`, `conteo-agregado`, `tasa-agregada`, `snapshot-agregado` (`esSnapshotSuprimido`), `campo-csv` (RFC 4180 + neutralización de fórmulas, `SIN_DATO_CSV`), `nombre-archivo-exportacion`, `transicion-estado-cohorte`, `rango-fechas-programa`. |
| `exceptions/` | `AdministrativoDomainException` (base), `FechasCohorteInvalidasException`, `TransicionCohorteInvalidaException`. |

## 3. Decisiones

1. **Enums como objeto `as const` + tipo homónimo**, no `enum` nativo de TypeScript. Un `enum` nativo de cadenas no admite literales (`'ACTIVA'`) ni se compara con ellos, y hoy aplicación, infraestructura, Prisma y los tests trabajan con literales. El patrón elegido da el mismo uso (`EstadoCohorte.ACTIVA`) y sigue aceptando los literales existentes, por lo que no rompe nada. Migrar a `enum` nativo, si se desea, se decide junto con la capa de aplicación.
2. **Mensajes de usuario** (p. ej. `MENSAJE_FALLO_TOTAL`) permanecen junto a la regla que los produce, dentro de su entidad: no son catálogos de valores sino textos de la regla.
3. **Value objects funcionales** (funciones puras con sufijo `.vo.ts`) en vez de clases, para conservar las firmas que ya consumen los casos de uso.
4. **Excepciones de dominio propias del módulo** (no se importa la base de `chat`, coherente con la regla de no acoplar internals entre módulos). Usan los mismos códigos y mensajes que `application/cohorte.errors.ts` para que la futura traducción a HTTP sea 1:1.
5. **`RecursoAuditado`** cataloga todos los literales de `recurso_afectado` que usa el módulo; por ahora solo el dominio lo consume (`accionExportacionCohorte`). `AccionAuditable.recurso` sigue tipado como `string` para no romper los consumidores.
6. Fuera del dominio **solo se cambiaron rutas de import**; ninguna línea de lógica de aplicación, infraestructura, presentación o tests.

## 4. Pendientes para la fase de aplicación

- [x] `gestionar-cohortes.use-case.ts` usa `validarTransicionCohorte` / `validarFechasCohorte` del dominio; `CohorteException.desdeDominio` traduce `AdministrativoDomainException` a la respuesta HTTP vigente (mismo `statusCode`, `codigo` y `mensaje`).
- [x] Enums del dominio adoptados en la capa de aplicación (se añadieron `EstadoFuenteAgregada` y `ModoRegistroAuditoria`). Pendiente: infraestructura y presentación.
- [x] Puertos de persistencia en `domain/repositories/`; los `application/*.errors.ts` pasaron a clases en `application/exceptions/` (`CohorteException`, `ParticipanteCohorteException`, `ExportacionCsvException`), junto con una clase por cada excepción que antes se construía dentro de casos de uso y services.
- [x] `application/administrativo.providers.ts` (`AdministrativoApplicationProviders`) agrupa services y casos de uso; el módulo lo esparce en `providers`.
- [x] `infrastructure/administrativo.providers.ts` (`AdministrativoInfrastructureProviders`) liga puertos con implementaciones (`useClass`) y los proveedores provisionales de M05/M06/M07 (`useValue`); `presentation/administrativo.providers.ts` exporta `AdministrativoPresentationControllers` y `AdministrativoPresentationProviders` (guards y filtro). `administrativo.module.ts` solo ensambla los tres.

## 5. Verificación

- `tsc -p tsconfig.build.json`: sin errores.
- `tsc -p tsconfig.json`: sin errores nuevos respecto a la línea base (los 34 preexistentes son de tests de otros módulos y uno en `exportacion-csv-rf144.e2e-spec.ts`, ajeno a este cambio).
- `jest` (unitarias): 153 suites / 1298 pruebas en verde; el módulo pasa de 2 a 3 suites (nuevo `cohorte.entity.spec.ts`).
- e2e de `test/administrativo/` no ejecutadas en esta sesión (requieren base de datos); compilan sin errores nuevos.

## Trazabilidad

- Módulo: M-8 (Administrativo). Specs relacionadas: RF-123, RF-124, RF-125, RF-132, RF-133, RF-134, RF-140, RF-141, RF-144, RF-148.
- Rama: `fix/RefactorizarModuloAdministrativo`.
