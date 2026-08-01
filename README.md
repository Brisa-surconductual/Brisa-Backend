<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Brsia Backend

Backend desarrollado con **NestJS** bajo una arquitectura **Monolito Modular**, implementando principios de **Arquitectura Hexagonal (Ports & Adapters)** y **Screaming Architecture**, con el objetivo de construir una aplicación escalable, mantenible y desacoplada.

---

# Tecnologías

| Tecnología | Versión |
|------------|---------|
| Node.js | v22.15.1 |
| pnpm | 11.12.0 |
| NestJS CLI | 11.0.24 |
| PostgreSQL | 18.1 |
| TypeScript | 5.7.3 |

---

# Arquitectura

El proyecto implementa una combinación de los siguientes enfoques arquitectónicos:

- Monolito Modular
- Arquitectura Hexagonal (Ports & Adapters)
- Screaming Architecture
- SOLID
- Inversión de Dependencias (Dependency Injection de NestJS)

El objetivo principal es desacoplar la lógica del negocio de las tecnologías utilizadas (Base de datos, Framework, APIs externas, etc.).

---

# Organización del proyecto

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

## Config

Contiene toda la configuración global del proyecto.
- Variables de entorno
- Configuración de JWT
- Base de datos
- Configuración general de NestJS

---

## Modules

Contiene los módulos del negocio.

Ejemplo:

```text
modules/

├── auth/
├── users/
├── products/
├── inventory/
└── ...
```

Cada módulo representa una funcionalidad independiente del sistema.

---

## Shared

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

# Organización de un módulo

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

---

# Domain

Es el núcleo del negocio.

Aquí vive toda la lógica de dominio.

Ejemplos:

```text
domain/

├── entities/
├── repositories/
├── enums/
├── exceptions/
└── value-objects/
```

Esta capa **NO depende** de NestJS, Prisma ni PostgreSQL.

Su responsabilidad es representar el negocio.

---

# Application

Contiene los casos de uso del sistema.

Ejemplos:

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

---

# Infrastructure

Contiene la implementación de tecnologías externas.

Ejemplos:

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

---

# Presentation

Es la capa encargada de comunicarse con el exterior.

Ejemplos:

```text
presentation/

├── controllers/
├── dto/
├── validators/
└── presenters/
```

Aquí llegan las peticiones HTTP.

Los controladores únicamente reciben la petición, validan los datos y delegan la ejecución a los casos de uso.

---

# Flujo de una petición

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

# Principios utilizados

- Single Responsibility Principle (SRP)
- Open/Closed Principle (OCP)
- Dependency Inversion Principle (DIP)
- Inyección de Dependencias de NestJS
- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión

---

# Instalación

## Clonar el proyecto

```bash
git clone <url-del-repositorio>
```

---

## Instalar dependencias

```bash
pnpm install
```

---

## Variables de entorno

Crear un archivo:

```text
.env
```

Configurar las variables correspondientes.

Ejemplo:

```env
DATABASE_URL=

JWT_SECRET=

PORT=
```

---

## Ejecutar el proyecto

Modo desarrollo

```bash
pnpm start:dev
```

Modo producción

```bash
pnpm build

pnpm start:prod
```

---

# Base de datos

Motor utilizado:

- PostgreSQL 18

ORM:

- Prisma ORM *(cuando sea integrado al proyecto)*

---

# Convenciones

- Cada módulo representa una funcionalidad del negocio.
- El dominio nunca depende de la infraestructura.
- No se debe acceder a la base de datos desde los controladores.
- Toda la lógica del negocio debe implementarse mediante casos de uso.
- Los repositorios del dominio son contratos, no implementaciones.

---

