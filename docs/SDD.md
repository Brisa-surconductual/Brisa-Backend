# Metodología SDD (Spec-Driven Development) — Brisa Backend

> **Estado:** en construcción. Este documento es la **fuente de verdad** del proceso de especificación del backend de Brisa. Se construye y ajusta de forma incremental; cualquier cambio de proceso se refleja aquí antes que en la práctica diaria.

## 1. Propósito

Formalizar cómo se especifica, discute y aprueba una funcionalidad **antes** de implementarla, de modo que:

- El código sea consecuencia de una especificación aprobada, no al revés.
- Exista un único lugar donde consultar qué comportamiento es correcto para una HU/RF, sin depender de memoria, chats o el propio código como única referencia.
- Los contratos ya existentes en `docs/` (`CONTRATO_HUxx`, `CONTRATO_RFxx`) dejen de ser documentos sueltos y pasen a seguir una convención común, con trazabilidad hacia historias de usuario (HU) y requisitos funcionales (RF) del proyecto de grado.

## 2. Contexto del proyecto

**Brisa** es una PWA (Progressive Web App) que ofrece terapia cognitivo-conductual para promover la cesación del vapeo (cigarrillo electrónico), desarrollada como proyecto de grado en el Semillero Surconductual (USCO).

Este repositorio es el **backend**. Stack completo del proyecto:

| Componente | Tecnología |
| --- | --- |
| Backend | NestJS |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Frontend | React + Tailwind CSS |
| Despliegue backend | Render (desde la rama `master`) |
| Despliegue de base de datos | Supabase (instancia compartida) |

### 2.1 Flujo de ramas y despliegue

Se manejan 3 ramas principales:

| Rama | Rol |
| --- | --- |
| `develop` | Integración de funcionalidades en desarrollo. |
| `test` | Rama de evaluación/QA antes de promover a `develop`. |
| `master` | Producción. Al hacer merge aquí, Render despliega el backend automáticamente. |

Flujo estándar de un desarrollador:

1. Crea su propia rama `feat/...` desde `develop`.
2. Envía el PR apuntando a `test`.
3. Se mergea a `test` y se evalúa ahí.
4. De `test` pasa a `develop`.
5. De `develop` pasa finalmente a `master` (dispara el despliegue en Render).

### 2.2 Gestión de la base de datos (migraciones)

La base de datos PostgreSQL vive en Supabase (instancia compartida) y el backend se conecta con el usuario `brisa_app`, que tiene permisos CRUD sobre registros (no DDL directo).

Regla operativa: **la base de datos se gestiona siempre por migraciones, nunca editando `schema.prisma` a mano para luego aplicarlo directo.**

1. Si se necesita un cambio en la base de datos, se crea una migración Prisma.
2. Se envía un PR con esa migración.
3. Al mergear el PR, un GitHub Action aplica la migración sobre la base de datos compartida en Supabase.
4. Cada desarrollador debe hacer `pull` y regenerar el cliente de Prisma localmente para quedar sincronizado.

### 2.3 Arquitectura

- **Arquitectura Hexagonal (Ports & Adapters)** + **Monolito Modular**.
- Orientación **Screaming Architecture** (la estructura de carpetas grita el dominio, no el framework).
- Principios **SOLID** y de **POO** aplicados de forma consistente en todos los módulos.

Las subsecciones siguientes documentan la anatomía real del repositorio (relevada directamente de `src/`, `prisma/`, `test/`, etc.) para que la creación de archivos nuevos **siga siempre** este orden, en vez de inventar una ubicación o un sufijo distinto cada vez. Se excluye `.idea` (configuración local del IDE, no es parte de la arquitectura).

#### 2.3.1 Anatomía de la raíz del repositorio

| Carpeta/archivo | Contenido |
| --- | --- |
| `.github/workflows/` | CI: build/test del backend (`backend.yml`), generación y despliegue de migraciones Prisma (`prisma-generate-schema.yml`, `prisma-migrate-deploy.yml`, `prisma-migrate-test-dev.yml`, `prisma-pr-check.yml`), `release.yml`. Implementa el flujo descrito en 2.2. |
| `config/` | Variables de entorno (`.env`, plantilla `env.txt`). No contiene código. |
| `dist/` | Salida de build de Nest. Generado, no se edita a mano. |
| `docs/` | Especificaciones (`CONTRATO_*`) y este documento de metodología. |
| `prisma/` | `schema.prisma` (modelo generado desde migraciones, nunca al revés), `migrations/` (migraciones aplicadas y vigentes, orden cronológico, inmutables una vez mergeadas), `migrations_backup/` (migraciones retiradas/superadas, se conservan por trazabilidad histórica), `generated/` (cliente de Prisma generado), `sql/` (SQL crudo para lo que el DSL de migraciones de Prisma no expresa directamente, p. ej. triggers/funciones), `prisma.module.ts` + `prisma.service.ts` (módulo Nest global que envuelve `PrismaClient`), y `prisma.config.ts` en la raíz. |
| `scripts/` | Utilidades Node fuera del runtime de Nest: `create-migration.js` (helper de migraciones), `check-production.cjs` / `verify-rf25c-db.cjs` (verificación puntual contra la BD), `deploy-render.mjs` (hook de despliegue). |
| `src/` | Código fuente de la aplicación. Ver 2.3.2 y 2.3.3. |
| `test/` | Pruebas e2e/integración, separadas de los `*.spec.ts` unitarios que viven junto al código. Ver 2.3.5. |
| `package.json`, `tsconfig*.json`, `nest-cli.json`, `eslint.config.mjs`, `.prettierrc` | Configuración de build, lint y formato. |
| `Dockerfile*`, `docker-compose.yaml`, `render.yaml` | Empaquetado y despliegue. |

#### 2.3.2 Anatomía de `src/`

```text
src/
├── main.ts            # bootstrap de Nest (único punto de entrada del proceso)
├── app.module.ts       # módulo raíz: importa Prisma + cada módulo de modules/ + shared/
├── modules/
│   └── <modulo>/        # uno por módulo de negocio (ver mapa de módulos, sección 4)
└── shared/
    └── presentation/     # únicamente primitivas de presentación genuinamente transversales
```

`shared/` **no** es un cajón de sastre: solo contiene lo que de verdad aplica a todos los módulos por igual (hoy: `health.controller.ts`, `roles.decorator.ts`, `role-guard.ts`). Lógica de un módulo específico va dentro de `modules/<modulo>/`, nunca en `shared/`.

#### 2.3.3 Anatomía de un módulo (`src/modules/<modulo>/`)

Todo módulo sigue las 4 capas de la arquitectura hexagonal, como subcarpetas de primer nivel: `domain/`, `application/`, `infrastructure/`, `presentation/`, más un `<modulo>.module.ts` en la raíz del módulo que ensambla las cuatro capas para Nest.

```text
modules/<modulo>/
├── <modulo>.module.ts
├── domain/
│   ├── entities/[<feature>/]*.entity.ts
│   ├── enums/*.enum.ts
│   ├── exceptions/*.exception.ts
│   ├── policies/*.policy.ts
│   ├── repositories/*.repository.ts        # puertos de persistencia (interfaces)
│   └── value-objects/*.vo.ts
├── application/
│   ├── dto/<feature>/*.dto-request.ts
│   ├── dto/<feature>/*.dto-response.ts
│   ├── exceptions/*.exception.ts
│   ├── ports/*.port.ts                      # puertos de infraestructura NO persistentes
│   ├── services/*.service.ts
│   ├── support/[testing/]*                  # helpers y fixtures internos de la capa
│   ├── use-cases/<feature>/*.use-case.ts    # un caso de uso = una operación de aplicación
│   └── <modulo>.providers.ts                # wiring de DI de esta capa
├── infrastructure/
│   ├── config/*.config.ts
│   ├── cron/*.cron.ts
│   ├── mappers/*.mapper.ts                  # entidad de dominio <-> modelo Prisma
│   ├── messaging/*.listener.ts|*.publisher.ts  # eventos entre módulos (@nestjs/event-emitter)
│   ├── persistence/prisma-<entidad>.repository.ts  # implementa domain/repositories
│   ├── security/*.ts                        # hashers, generadores de token
│   ├── storage/*.adapter.ts                 # S3 u otros proveedores externos
│   ├── validation/*.adapter.ts
│   └── <modulo>.providers.ts                # liga implementaciones a los puertos de domain/application
└── presentation/
    ├── controllers/<feature>/*.controller.ts
    ├── decorators/*.decorator.ts
    ├── filters/*.filter.ts
    ├── guards/*.guard.ts
    ├── http/*-request.ts                    # tipado de Request autenticado/ampliado
    ├── interceptors/*.interceptor.ts
    └── <modulo>.providers.ts
```

Reglas de capa (lo que ya se viene cumpliendo en el módulo `chat`, el más maduro, y que se toma como referencia):

- **`domain/`** no importa Nest ni Prisma. Son clases/tipos TypeScript puros: entidades, value objects, políticas de negocio y las **interfaces** de los repositorios (nunca su implementación).
- **`application/`** orquesta casos de uso contra los puertos de `domain/repositories` y `application/ports`. Un caso de uso (`*.use-case.ts`) es la única puerta de entrada que un controlador puede llamar; no se invoca un repositorio ni un mapper directamente desde `presentation/`.
- **`infrastructure/`** es la única capa que conoce Prisma, S3, proveedores de correo, criptografía concreta, etc. Implementa los puertos definidos en `domain/` (repositorios) y `application/` (ports) y los liga mediante `<modulo>.providers.ts`.
- **`presentation/`** solo traduce HTTP ↔ caso de uso: valida con DTOs, aplica guards/decorators/filters/interceptors, y delega en `application/use-cases`.
- La comunicación **entre módulos** (coherente con las dependencias de la sección 4: p. ej. Chat y Cronograma dependiendo de Usuarios) se hace a través de `infrastructure/messaging` (`*.listener.ts` / `*.publisher.ts` sobre `@nestjs/event-emitter`), no importando directamente clases internas de otro módulo.

#### 2.3.4 Convención de sufijos por tipo de archivo

| Sufijo/patrón | Capa / carpeta | Significado |
| --- | --- | --- |
| `*.entity.ts` | `domain/entities` | Entidad o agregado de dominio. |
| `*.enum.ts` | `domain/enums` | Enumeración de dominio. |
| `*.exception.ts` | `domain/exceptions`, `application/exceptions` | Error de negocio/aplicación (no HTTP). |
| `*.policy.ts` | `domain/policies` | Regla de negocio reutilizable que no pertenece a una sola entidad. |
| `*.repository.ts` | `domain/repositories` | **Puerto** de persistencia (interfaz). |
| `*.vo.ts` | `domain/value-objects` | Value object con sus propias invariantes. |
| `*.dto-request.ts` / `*.dto-response.ts` | `application/dto/<feature>` | Contrato de entrada/salida de un caso de uso. |
| `*.port.ts` | `application/ports` | Puerto de infraestructura no persistente (storage, email, hashing, tokens, publishers). |
| `*.service.ts` | `application/services` | Lógica compartida entre varios casos de uso. |
| `*.use-case.ts` (+ `*.use-case.spec.ts` colocado) | `application/use-cases/<feature>` | Una operación de aplicación = una clase. |
| `*.config.ts` | `infrastructure/config` | Configuración derivada de variables de entorno. |
| `*.cron.ts` | `infrastructure/cron` | Tarea programada (`@nestjs/schedule`). |
| `*.mapper.ts` | `infrastructure/mappers` | Traducción entidad de dominio ↔ modelo Prisma. |
| `*.listener.ts` / `*.publisher.ts` | `infrastructure/messaging` | Adaptadores de eventos entre módulos. |
| `prisma-<entidad>.repository.ts` | `infrastructure/persistence` | Implementación concreta de un puerto `domain/repositories`. |
| `*.adapter.ts` | `infrastructure/storage`, `infrastructure/validation` | Integración con un proveedor/formato externo. |
| `*.controller.ts` (+ `*.controller.spec.ts` o `*.http.spec.ts`) | `presentation/controllers/<feature>` | Endpoint HTTP. |
| `*.decorator.ts` | `presentation/decorators` | Decorador de parámetro/metadata de Nest. |
| `*.filter.ts` | `presentation/filters` | Exception filter de Nest. |
| `*.guard.ts` | `presentation/guards` | Guard de autenticación/autorización. |
| `*.interceptor.ts` | `presentation/interceptors` | Interceptor de request/response. |
| `<modulo>.module.ts` | raíz del módulo | Ensambla las 4 capas para Nest. |
| `<modulo>.providers.ts` | raíz de cada capa que lo requiera | Wiring de DI de esa capa (puede existir uno en `application/`, otro en `infrastructure/` y otro en `presentation/` del mismo módulo). |

#### 2.3.5 Pruebas: unitarias vs. e2e/integración

- **Unitarias**: `*.spec.ts` colocado junto al archivo que prueba, dentro de `src/modules/<modulo>/...` (p. ej. `crear-flujo-conversacional.use-case.spec.ts` al lado de `crear-flujo-conversacional.use-case.ts`).
- **e2e / integración**: viven en `test/<modulo>/`, con su propio `test/jest-<modulo>-e2e.json` cuando el módulo lo requiere (`chat`, `cronograma`) o el genérico `test/jest-e2e.json`. Fixtures de estos tests van en `test/<modulo>/fixtures/`.
- Un archivo nuevo de dominio/aplicación/infraestructura que introduce lógica no trivial se acompaña de su `*.spec.ts` en el mismo PR; no se deja para después.

#### 2.3.6 Inconsistencias detectadas (no replicar en archivos nuevos)

El relevamiento de `src/` muestra que módulos más antiguos (`cronograma`, `usuarios`, `administrativo`) se desviaron de la convención que sí sigue el módulo más reciente y completo (`chat`). Para archivos **nuevos**, se usa siempre la forma canónica; corregir lo existente es una tarea aparte (no se renombra como efecto colateral de otra tarea):

| Desviación encontrada | Canónico | Dónde aparece la desviación |
| --- | --- | --- |
| `domain/exeption` (singular, mal escrito) | `domain/exceptions` | `cronograma`, `usuarios` |
| `infraestructre` (typo) | `infrastructure` | `administrativo` (módulo aún sin implementar, solo tiene `domain/` e `infraestructre/` vacíos) |
| `application/service` (singular) | `application/services` | `cronograma` |
| `users.module.ts` (nombre en inglés) | `<modulo>.module.ts` → `usuarios.module.ts` | `usuarios` |
| Controladores planos en `presentation/*.controller.ts` | `presentation/controllers/<feature>/*.controller.ts` | `cronograma` |
| `acceso.decorators.ts` (sufijo en plural) | `*.decorator.ts` (singular) | `chat` |

## 3. Fuente de verdad de los requisitos (RF)

Los **RF (Requisitos Funcionales) son siempre la fuente de verdad del proyecto**, por encima de este documento, del código y de cualquier spec individual.

Ubicación: `C:\Users\samue\Documents\USCO\Proyecto de grado\Requerimientos\Especificacion Requerimientos.xlsx`

Documentos relacionados en la misma carpeta:

- `Matriz de modulos.xlsx`
- `Matriz de requerimientos.xlsx`

Los RF están **abiertos a modificación**: si durante el desarrollo se detecta una inconsistencia, una oportunidad de mejora o un vacío, se puede (y se debe) abordar y proponer el ajuste correspondiente sobre ese archivo, en lugar de resolverlo únicamente en el código o en una spec sin dejarlo reflejado en la fuente de verdad.

## 4. Mapa de módulos

Según la matriz de módulos del proyecto:

| ID | Módulo | Tipo | Criticidad | MoSCoW | Depende de | Lo usan |
| --- | --- | --- | --- | --- | --- | --- |
| M-1 | Gestión de Usuario | Core | Alta | Must | n/a | M-2 a M-8 |
| M-2 | Diario | Integración | Baja | Must | M-1 | M-5, M-8 |
| M-3 | Chat | Core | Alta | Must | M-1, M-4 | M-5, M-8 |
| M-4 | Cronograma | Soporte | Alta | Must | M-1 | M-3, M-5, M-6, M-7 |
| M-5 | Seguimiento | Soporte | Alta | Should | M-1, M-2, M-3, M-4, M-6 | M-8 |
| M-6 | Gamificación/Storytelling | Integración | Baja | Could | M-1, M-4 | M-5 |
| M-7 | Notificación & EMA | Integración | Alta | Should | M-1, M-4 | M-8 |
| M-8 | Administrativo | Core | Alta | Must | M-1, M-2, M-3, M-5, M-7 | n/a |

Esta dependencia entre módulos condiciona el orden en que conviene especificar e implementar funcionalidades: un módulo no debería especificarse como si estuviera terminado si un módulo del que depende (columna "Depende de") todavía no tiene su contrato aprobado.

## 5. Principios de la metodología

1. **Spec primero.** No se escribe código de una funcionalidad nueva sin que exista (al menos) un borrador de spec aprobado.
2. **El RF es la fuente de verdad última; la spec es la fuente de verdad del contrato técnico.** Si el código y la spec difieren, se corrige el código (o se actualiza la spec explícitamente y se registra por qué). Si la spec y el RF difieren, se revisa primero si el RF necesita ajustarse (sección 3) antes de asumir que la spec está mal.
3. **Una spec por contrato observable.** Cada endpoint, evento o regla de negocio relevante tiene una spec identificable; no se mezclan funcionalidades no relacionadas en un mismo documento salvo que compartan el mismo contrato (como ya ocurre con RF-27/28/29).
4. **Trazabilidad obligatoria.** Toda spec referencia la(s) HU/RF de la que nace y, cuando exista, el PR/rama que la implementa.
5. **Cambios incrementales versionados por historia de git.** No se reescribe una spec aprobada para "corregir silenciosamente" un comportamiento; se añade una sección de cambios o se abre una nueva spec si el contrato cambia de forma incompatible.

## 6. Ciclo de vida de una especificación

| Estado | Significado |
| --- | --- |
| `BORRADOR` | En discusión, puede cambiar de forma significativa. |
| `APROBADA` | Lista para implementar; cambios de contrato requieren registrar el motivo. |
| `IMPLEMENTADA` | El código en `develop`/`master` cumple la spec. Referencia el PR. |
| `OBSOLETA` | Reemplazada por otra spec o funcionalidad retirada. Se conserva por trazabilidad histórica, no se borra. |

## 7. Estructura de una spec (plantilla)

Basada en el formato que ya usan los `CONTRATO_*` existentes:

```markdown
# <RF-xx / HU-xx> — <nombre corto de la funcionalidad>

## Estado
BORRADOR | APROBADA | IMPLEMENTADA | OBSOLETA

## Operación y acceso
- Verbo + ruta
- Rol(es) requeridos, autenticación, headers esperados
- Forma de la respuesta (envoltura, cache-control, etc.)

## Request
- Forma del payload, tabla de campos y tipos
- Reglas de validación

## Respuesta(s)
- Casos de éxito (con ejemplo JSON)
- Casos de error relevantes

## Configuración y validación
- Reglas de negocio, casos borde, compatibilidad con literales/formatos históricos

## Trazabilidad
- HU/RF de origen (según `Especificacion Requerimientos.xlsx`)
- PR / rama que implementa (cuando exista)
- Specs relacionadas o dependientes (incluyendo módulo(s) de la sección 4 involucrados)
```

No todas las secciones aplican a toda spec (p. ej. una regla de negocio interna sin endpoint propio no necesita "Operación y acceso"), pero **Estado** y **Trazabilidad** son obligatorias en toda spec nueva a partir de este documento.

## 8. Convención de nombres y ubicación

- Ubicación: `docs/`.
- Nombre: `CONTRATO_<HUxx|RFxx>_<NOMBRE_CORTO>.md`, mayúsculas con guion bajo, igual que los documentos existentes.
- Documentos que no son contratos de comportamiento sino decisiones técnicas (p. ej. `RF25B_DECISIONES_TECNICAS.md`) usan el sufijo `_DECISIONES_TECNICAS` y no siguen la plantilla de la sección 7.

## 9. Registro de especificaciones

| Documento | HU/RF | Módulo | Estado | Notas |
| --- | --- | --- | --- | --- |
| [`CONTRATO_HU03_CHAT_ADMIN.md`](CONTRATO_HU03_CHAT_ADMIN.md) | HU-03 | M-3 (Chat) | IMPLEMENTADA (asumido, por confirmar) | Pendiente de revisar contra este formato |
| [`CONTRATO_HU05_RF25C.md`](CONTRATO_HU05_RF25C.md) | HU-05 / RF-25C | Por confirmar | IMPLEMENTADA (asumido, por confirmar) | Pendiente de revisar contra este formato |
| [`CONTRATO_RF26_NODO_ACTUAL.md`](CONTRATO_RF26_NODO_ACTUAL.md) | RF-26 / RF-33 | M-3 (Chat) | IMPLEMENTADA (PR #47) | Cambio 2026-11-20: tipos de entrada canónicos e `idRecurso` (`feat/chat-rf26-entradas-canonicas`) |
| [`CONTRATO_RF27_RF28_RF29.md`](CONTRATO_RF27_RF28_RF29.md) | RF-27 / RF-27B / RF-28 / RF-29 | M-3 (Chat) | IMPLEMENTADA | Reglas vigentes; el request/response camelCase quedó OBSOLETO, rige el de RF-30 |
| [`CONTRATO_RF30_INTERACCIONES.md`](CONTRATO_RF30_INTERACCIONES.md) | RF-30 | M-3 (Chat) | IMPLEMENTADA (PR #59) | Contrato vigente de `POST /chat/sesiones/:id_sesion/respuestas` |
| [`CONTRATO_RF31_RF32_HISTORIAL.md`](CONTRATO_RF31_RF32_HISTORIAL.md) | RF-31 / RF-32 (con RF-30, RF-33) | M-3 (Chat) | APROBADA (implementación en `feat/chat-rf32-historial-interacciones`) | `GET /chat/sesiones/:idSesion/interacciones`; e2e con BD local pendiente |
| [`RF25B_DECISIONES_TECNICAS.md`](RF25B_DECISIONES_TECNICAS.md) | RF-25B | Por confirmar | N/A (decisión técnica) | No es contrato de comportamiento |

> Esta tabla se mantiene al día en esta misma sesión y en las siguientes: cada spec nueva o cambio de estado se refleja aquí.

## 10. Relación con código y pruebas

- Las pruebas e2e (`test/jest-*-e2e.json`) son la verificación ejecutable de una spec `APROBADA`/`IMPLEMENTADA`. Una spec sin prueba e2e asociada queda marcada como pendiente en su sección de Trazabilidad.
- Un PR que implementa una spec debe referenciarla explícitamente en su descripción, y debe seguir el flujo de ramas de la sección 2.1 (`feat/...` → `test` → `develop` → `master`).
- Si la spec implica cambios de base de datos, el PR correspondiente debe incluir la migración Prisma (sección 2.2), nunca una edición directa de `schema.prisma`.

## 11. Pendientes de esta sesión

- [ ] Confirmar estado real (`IMPLEMENTADA`/`APROBADA`) de cada documento en la tabla de la sección 9.
- [ ] Completar la columna "Módulo" de la sección 9 para los contratos marcados como "Por confirmar".
- [ ] Decidir si los contratos existentes se migran a la plantilla de la sección 7 o se dejan como están y solo las specs nuevas la siguen.
