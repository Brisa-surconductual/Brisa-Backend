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
| [`CONTRATO_RF26_NODO_ACTUAL.md`](CONTRATO_RF26_NODO_ACTUAL.md) | RF-26 | M-3 (Chat) | En integración (PR #47 según RF27_RF28_RF29) | — |
| [`CONTRATO_RF27_RF28_RF29.md`](CONTRATO_RF27_RF28_RF29.md) | RF-27 / RF-27B / RF-28 / RF-29 | M-3 (Chat) | Por confirmar | Rama parte de `test` (`a537a4e`) |
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
