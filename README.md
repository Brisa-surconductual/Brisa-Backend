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
  - [5. Configurar la base de datos](#5-configurar-la-base-de-datos)
    - [Opción A · Restaurar el backup](#opción-a--restaurar-el-backup)
    - [Opción B · Aplicar las migraciones (recomendada)](#opción-b--aplicar-las-migraciones-recomendada)
  - [6. Generar el cliente de Prisma](#6-generar-el-cliente-de-prisma)
  - [7. Ejecutar el proyecto](#7-ejecutar-el-proyecto)
- [Recursos multimedia con S3](#recursos-multimedia-con-s3)
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

Crea el archivo `config/.env` (puedes basarte en `config/env.txt`):

```env
DATABASE_URL=

SHADOW_DATABASE_URL=

JWT_SECRET=

PORT=3000

AWS_REGION=us-east-2
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_UPLOAD_EXPIRATION_SECONDS=300
AWS_S3_RESOURCE_PREFIX=cronograma/recursos
```

> ⚠️ **Importante:** `DATABASE_URL` y `SHADOW_DATABASE_URL` son las únicas variables que Prisma necesita para trabajar con la base de datos y las migraciones. Toda la configuración adicional de migraciones (datasource, shadow database, etc.) vive en `prisma.config.ts`, ya versionado en el repositorio — no hay que tocarlo para levantar el proyecto, solo completar estas dos URLs.
>
> Pide los valores reales de ambas variables en el canal privado del equipo. Nunca se suben credenciales reales al repositorio.

### 5. Configurar la base de datos

Este proyecto usa **una única base de datos compartida en Supabase** para todo el equipo — no cada desarrollador trabaja contra su propia base de datos aislada. Esto significa que, en la mayoría de los casos, **no necesitas crear ni migrar nada tú mismo**: la base de datos ya existe y ya tiene la estructura al día.

Elige la opción según tu situación:

#### Opción A · Restaurar el backup

Úsala únicamente si vas a trabajar contra una base de datos **local**, separada de la compartida en Supabase (por ejemplo, para pruebas aisladas o mientras no tienes conexión a internet).

Primero crea una base de datos vacía:

```bash
createdb surconductual
```

**Si el archivo de backup es `.sql` (formato plano):**

```bash
psql -U <usuario> -d surconductual -f nombre-del-backup.sql
```

**Si el archivo es `.dump` o `.backup` (formato binario/custom de pg_dump):**

```bash
pg_restore -U <usuario> -d surconductual nombre-del-backup.dump
```

> 📌 Reemplaza `nombre-del-backup` por el nombre real del archivo, y apunta tu `DATABASE_URL` local a esta base de datos restaurada.

#### Opción B · Aplicar las migraciones (recomendada)

Úsala cuando tu `DATABASE_URL` ya apunta a la base de datos compartida de Supabase (el caso normal para el día a día del equipo). El historial de migraciones versionado en `prisma/migrations/` ya refleja el estado real de esa base de datos, así que no hace falta crear ni restaurar nada — solo confirmar que tu entorno está alineado:

```bash
pnpm dlx prisma migrate deploy
```

Este comando aplica cualquier migración pendiente que aún no se haya ejecutado contra la base de datos (por ejemplo, si alguien del equipo generó una migración nueva después de tu último `git pull`). Si la base de datos ya está al día, el comando simplemente no hace nada — es seguro ejecutarlo siempre que quieras confirmar que estás sincronizado.

> ⚠️ Este comando **nunca genera** una migración nueva ni te pide confirmación de cambios — solo aplica las que ya existen en el repositorio. Para generar una migración nueva a partir de un cambio de esquema, ve a [Flujo de trabajo con Prisma](#flujo-de-trabajo-con-prisma).

### 6. Generar el cliente de Prisma

Sin importar qué opción hayas usado en el paso anterior, genera el cliente de Prisma para que el proyecto pueda usarlo con tipado seguro:

```bash
pnpm dlx prisma generate
```

> 📌 Si en algún momento `nest start` marca errores de tipos que no cuadran con tu código (una tabla o columna que "no existe" según TypeScript), lo primero que debes revisar es si te falta correr este comando después de un `git pull`.

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

Si todo salió bien, el backend debería quedar corriendo en `http://localhost:<PORT>` (el puerto que definiste en `config/.env`).

---

## Recursos multimedia con S3

El bucket debe permanecer privado. La aplicación genera claves únicamente bajo
`AWS_S3_RESOURCE_PREFIX` y siempre utiliza el bucket definido en
`AWS_S3_BUCKET`; el cliente nunca puede elegir otro bucket ni enviar una clave
arbitraria.

Flujo para una PWA autenticada como administrativo:

1. Solicita una URL con `POST /cronograma/recursos/url-subida`, enviando
   `id_contenido`, `tipo_recurso`, `mime_type` y `tamano_bytes`.
2. Sube el archivo con `PUT` directamente a `url_subida`, usando exactamente los
   encabezados devueltos por el backend. El binario nunca pasa por NestJS.
3. Confirma la creación con `POST /cronograma/recursos`, enviando la
   `clave_almacenamiento` recibida, el mismo MIME/tamaño y al menos un módulo
   destino. Antes de persistir, el backend verifica el objeto con S3.

Para texto no se solicita URL: se usa directamente `POST /cronograma/recursos`
con `tipo_recurso: "TEXTO"` y `texto_contenido`.

El usuario o rol IAM de la aplicación necesita solamente `s3:PutObject` y
`s3:GetObject` (requerido por `HeadObject`) sobre
`arn:aws:s3:::<bucket>/cronograma/recursos/*`. En despliegue se recomienda un rol
IAM; las variables `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` pueden omitirse
cuando el entorno ya proporciona credenciales mediante dicho rol.

---

## Flujo de trabajo con Prisma

Este proyecto usa **migraciones versionadas de Prisma** (`prisma migrate`). El esquema `schema.prisma` es la fuente de verdad: todo cambio de estructura se hace primero ahí, y luego se convierte en una migración versionada que queda registrada en `prisma/migrations/` y se aplica de forma reproducible sobre la base de datos compartida.

**La base de datos de Supabase nunca se edita a mano** (ni desde el SQL Editor del panel, ni con `psql` manual, ni con herramientas externas) para cambios de estructura. Todo pasa por este flujo.

### Si solo vas a trabajar con el esquema tal como está

No necesitas hacer nada especial más allá de lo descrito en la [Guía de inicio rápido](#5-configurar-la-base-de-datos): cada vez que hagas `git pull` y veas una carpeta nueva en `prisma/migrations/`, corre:

```bash
pnpm dlx prisma generate
```

Esto es suficiente porque la migración ya fue aplicada una sola vez, contra la base de datos compartida, por quien la generó. No hace falta que cada desarrollador la vuelva a aplicar.

### Si necesitas cambiar el esquema (agregar una tabla, columna, relación, etc.)

1. Edita `schema.prisma` con el cambio que necesitas.
2. **Avisa en el canal del equipo antes de continuar.** Como todos comparten la misma base de datos en Supabase, solo una persona debe estar migrando a la vez para evitar choques.
3. Genera y aplica la migración:
   ```bash
   pnpm dlx prisma migrate dev --name descripcion_corta_del_cambio
   ```
   Este comando compara tu `schema.prisma` contra el historial de migraciones existente, genera el SQL de diferencia, te lo muestra para revisión (presta especial atención si incluye algo potencialmente destructivo, como un `DROP COLUMN`), lo aplica contra la base de datos real, y regenera el cliente de Prisma automáticamente.
4. Commitea la carpeta nueva de `prisma/migrations/<timestamp>_descripcion_corta_del_cambio/` junto con tu cambio de código — es parte del repositorio, no se ignora en git.
5. Avisa al equipo que ya se aplicó, para que cada quien corra `git pull` seguido de `pnpm dlx prisma generate`.

### Reglas del equipo

- **Nunca se editan tablas, columnas o constraints directamente en Supabase.** Todo cambio de esquema pasa por `schema.prisma` + `prisma migrate dev`.
- **No se usa `prisma db push`** para cambios de esquema del día a día — no deja registro en `prisma/migrations/` y desincroniza el historial del equipo.
- **Solo una persona migra a la vez.** Confirma con el equipo antes de correr `migrate dev` contra la base de datos compartida.
- Si un comando de migración falla a mitad de camino, no sigas intentando comandos al azar — revisa el mensaje de error completo y coordina con el equipo antes de forzar cualquier `migrate resolve`.
- La configuración de conexión para migraciones (incluida la shadow database) vive en `prisma.config.ts`, ya versionado — no debe modificarse sin coordinarlo con el equipo, ya que afecta a todos por igual.

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
- Los cambios de esquema se hacen siempre en `schema.prisma` y se convierten en migraciones versionadas con `prisma migrate dev` (ver [Flujo de trabajo con Prisma](#flujo-de-trabajo-con-prisma)). Nunca se edita la base de datos de Supabase directamente.

---

<p align="center">
  Semillero Surconductual · Universidad Surcolombiana (USCO)
</p>
