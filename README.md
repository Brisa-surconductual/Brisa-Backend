<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">Brisa · Backend</h1>

<p align="center">
  Backend del proyecto <strong>Brisa</strong>, una PWA de terapia psicoconductual dirigida a estudiantes universitarios consumidores de cigarrillo electrónico (vapeador).
  <br/>
  Proyecto de grado desarrollado en el <strong>Semillero Surconductual</strong> — Universidad Surcolombiana (USCO).
</p>

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11.0.24-E0234E?logo=nestjs&logoColor=white" />
  <img alt="Node" src="https://img.shields.io/badge/Node.js-22.15.1-339933?logo=node.js&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-18.1-4169E1?logo=postgresql&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-11.12.0-F69220?logo=pnpm&logoColor=white" />
</p>

---

## Tabla de contenidos

- [Sobre el proyecto](#sobre-el-proyecto)
- [Tecnologías](#tecnologías)
- [Guía de inicio rápido](#guía-de-inicio-rápido)
  - [1. Requisitos previos](#1-requisitos-previos)
  - [2. Clonar el proyecto](#2-clonar-el-proyecto)
  - [3. Instalar dependencias](#3-instalar-dependencias)
  - [4. Configurar variables de entorno](#4-configurar-variables-de-entorno)
  - [5. Restaurar el backup de la base de datos](#5-restaurar-el-backup-de-la-base-de-datos)
  - [6. Sincronizar Prisma con la base de datos](#6-sincronizar-prisma-con-la-base-de-datos)
  - [7. Ejecutar el proyecto](#7-ejecutar-el-proyecto)
- [Flujo de trabajo con Prisma](#flujo-de-trabajo-con-prisma)
- [Arquitectura](#arquitectura)
- [Organización del proyecto](#organización-del-proyecto)
- [Organización de un módulo](#organización-de-un-módulo)
- [Flujo de una petición](#flujo-de-una-petición)
- [Principios utilizados](#principios-utilizados)
- [Convenciones](#convenciones)

---

## Sobre el proyecto

**Brisa** es una Progressive Web App (PWA) cuyo objetivo es brindar acompañamiento de **terapia psicoconductual** a estudiantes universitarios que consumen vapeador (cigarrillo electrónico). El proyecto nace en el **Semillero Surconductual** de la **Universidad Surcolombiana (USCO)** como proyecto de grado, con un enfoque centrado en la evidencia y el bienestar del estudiante.

Este repositorio corresponde exclusivamente al **backend**, desarrollado con NestJS bajo una arquitectura **Monolito Modular**, aplicando principios de **Arquitectura Hexagonal (Ports & Adapters)** y **Screaming Architecture**, con el objetivo de construir una aplicación escalable, mantenible y desacoplada de la tecnología subyacente.

---

## Tecnologías

| Tecnología | Versión |
|------------|---------|
| Node.js | v22.15.1 |
| pnpm | 11.12.0 |
| NestJS CLI | 11.0.24 |
| PostgreSQL | 18.1 |
| Prisma ORM | (ver `package.json`) |
| TypeScript | 5.7.3 |

---

## Guía de inicio rápido

Esta sección está pensada para cualquier persona del equipo que vaya a levantar el backend **por primera vez**. Sigue los pasos en orden.

### 1. Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- [Node.js v22.15.1](https://nodejs.org/) (recomendado usar `nvm` para manejar versiones)
- [pnpm](https://pnpm.io/) `>= 11.12.0`
- [PostgreSQL 18](https://www.postgresql.org/) instalado y corriendo localmente (o acceso a una instancia remota)
- Cliente de PostgreSQL en consola (`psql` y/o `pg_restore`), incluido con la instalación de PostgreSQL

### 2. Clonar el proyecto

```bash
git clone <url-del-repositorio>
cd brisa-backend
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (puedes basarte en `.env.example` si existe):

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/brisa_db

JWT_SECRET=

PORT=3000
```

> ⚠️ **Importante:** `DATABASE_URL` debe apuntar a la base de datos donde vas a restaurar el backup del siguiente paso. El nombre de la base de datos (`brisa_db` en el ejemplo) debe coincidir con el que uses al restaurar.

### 5. Restaurar el backup de la base de datos

En la raíz del proyecto encontrarás un archivo de **backup** con la estructura y datos base de la aplicación. Antes de continuar, crea una base de datos vacía:

```bash
createdb brisa_db
```

Luego restaura el backup según su formato:

**Si el archivo es `.sql` (formato plano):**

```bash
psql -U <usuario> -d brisa_db -f nombre-del-backup.sql
```

**Si el archivo es `.dump` o `.backup` (formato binario/custom de pg_dump):**

```bash
pg_restore -U <usuario> -d brisa_db nombre-del-backup.dump
```

> 📌 Reemplaza `nombre-del-backup` por el nombre real del archivo que está en la raíz del repositorio. Este paso es **obligatorio** antes de continuar, ya que el proyecto no crea el esquema desde cero mediante migraciones de Prisma.

### 6. Sincronizar Prisma con la base de datos

Este proyecto **no usa migraciones de Prisma** (`prisma migrate`). El flujo de trabajo es al revés: **la base de datos es la fuente de verdad**, y Prisma se sincroniza a partir de ella. Por eso, después de restaurar el backup, debes ejecutar:

```bash
pnpm dlx prisma db pull
```

Esto leerá el esquema real de la base de datos restaurada y actualizará el archivo `schema.prisma` en consecuencia.

Después, genera el cliente de Prisma para que el proyecto pueda usarlo:

```bash
pnpm dlx prisma generate
```

> ℹ️ Ver la sección [Flujo de trabajo con Prisma](#flujo-de-trabajo-con-prisma) para entender por qué se trabaja así y qué hacer si necesitas cambiar el esquema.

### 7. Ejecutar el proyecto

Modo desarrollo:

```bash
pnpm start:dev
```

Modo producción:

```bash
pnpm build
pnpm start:prod
```

Si todo salió bien, el backend debería quedar corriendo en `http://localhost:<PORT>` (el puerto que definiste en tu `.env`).

---

## Flujo de trabajo con Prisma

A diferencia del flujo tradicional de Prisma (donde el esquema `schema.prisma` es la fuente de verdad y se generan migraciones con `prisma migrate dev`), en este proyecto se trabaja de forma inversa:

1. **Los cambios en el esquema se hacen directamente en la base de datos** (tablas, columnas, relaciones, etc.), ya sea manualmente o mediante herramientas externas al proyecto.
2. Una vez la base de datos refleja el estado deseado, se ejecuta:
   ```bash
   pnpm dlx prisma db pull
   ```
   Este comando introspecciona la base de datos y regenera `schema.prisma` para que coincida con la estructura real.
3. Finalmente, se ejecuta:
   ```bash
   pnpm dlx prisma generate
   ```
   Esto regenera el **Prisma Client**, que es lo que el código de la aplicación (capa de `infrastructure`) usa para interactuar con la base de datos con tipado seguro.

**¿Por qué es importante esto para el equipo?**

- Si haces cambios en el esquema de la base de datos, **no olvides correr `db pull` + `generate`**, o el código quedará desincronizado con la estructura real.
- Si notas que Prisma Client no reconoce un campo o tabla nueva, lo más probable es que falte ejecutar este flujo.
- No se deben crear migraciones manuales de Prisma (`prisma migrate dev`) en este proyecto, ya que rompería la convención de trabajo actual.

---

## Arquitectura

El proyecto implementa una combinación de los siguientes enfoques arquitectónicos:

- Monolito Modular
- Arquitectura Hexagonal (Ports & Adapters)
- Screaming Architecture
- SOLID
- Inversión de Dependencias (Dependency Injection de NestJS)

El objetivo principal es desacoplar la lógica del negocio de las tecnologías utilizadas (Base de datos, Framework, APIs externas, etc.).

---

## Organización del proyecto

```text
src/

├── config/
│
├── modules/
│
├── shared/
│
├── app.module.ts
│
└── main.ts
```

### Config

Contiene toda la configuración global del proyecto.
- Variables de entorno
- Configuración de JWT
- Base de datos
- Configuración general de NestJS

### Modules

Contiene los módulos del negocio.

```text
modules/

├── auth/
├── users/
├── products/
├── inventory/
└── ...
```

Cada módulo representa una funcionalidad independiente del sistema.

### Shared

Contiene componentes reutilizables por todos los módulos.

Ejemplos:

- Guards
- Decorators
- Pipes
- Filters
- Interceptors
- Utilidades
- Constantes
- Interfaces compartidas

---

## Organización de un módulo

Cada módulo sigue una estructura basada en Arquitectura Hexagonal.

```text
users/

├── domain/
├── application/
├── infrastructure/
├── presentation/
│
└── users.module.ts
```

### Domain

Es el núcleo del negocio. Aquí vive toda la lógica de dominio.

```text
domain/

├── entities/
├── repositories/
├── enums/
├── exceptions/
└── value-objects/
```

Esta capa **NO depende** de NestJS, Prisma ni PostgreSQL. Su responsabilidad es representar el negocio.

### Application

Contiene los casos de uso del sistema.

```text
application/

├── dto/
├── use-cases/
└── mappers/
```

Aquí se implementan acciones como:

- Crear usuario
- Actualizar usuario
- Iniciar sesión
- Registrar producto

La lógica de aplicación utiliza los contratos definidos en el dominio.

### Infrastructure

Contiene la implementación de tecnologías externas.

```text
infrastructure/

├── persistence/
├── services/
├── clients/
└── mappers/
```

Aquí viven las implementaciones de:

- PostgreSQL
- Prisma ORM
- Redis
- APIs externas
- Servicios de correo
- Almacenamiento

Esta capa implementa las interfaces definidas en el dominio.

### Presentation

Es la capa encargada de comunicarse con el exterior.

```text
presentation/

├── controllers/
├── dto/
├── validators/
└── presenters/
```

Aquí llegan las peticiones HTTP. Los controladores únicamente reciben la petición, validan los datos y delegan la ejecución a los casos de uso.

---

## Flujo de una petición

```text
Cliente

↓

Controller

↓

Use Case

↓

Repository (Contrato)

↓

Implementación del Repository

↓

PostgreSQL
```

Las dependencias siempre apuntan hacia el dominio.

```text
Presentation
      │
      ▼
Application
      │
      ▼
Domain
      ▲
Infrastructure
```

De esta forma el dominio permanece independiente de cualquier tecnología.

---

## Principios utilizados

- Single Responsibility Principle (SRP)
- Open/Closed Principle (OCP)
- Dependency Inversion Principle (DIP)
- Inyección de Dependencias de NestJS
- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión

---

## Convenciones

- Cada módulo representa una funcionalidad del negocio.
- El dominio nunca depende de la infraestructura.
- No se debe acceder a la base de datos desde los controladores.
- Toda la lógica del negocio debe implementarse mediante casos de uso.
- Los repositorios del dominio son contratos, no implementaciones.
- Los cambios de esquema se hacen en la base de datos, seguidos de `prisma db pull` + `prisma generate` (ver [Flujo de trabajo con Prisma](#flujo-de-trabajo-con-prisma)).

---

<p align="center">
  Semillero Surconductual · Universidad Surcolombiana (USCO)
</p>