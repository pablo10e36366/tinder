# Tinder Backend

Backend tipo Tinder construido con NestJS, TypeScript, Prisma y PostgreSQL.

## Arquitectura

El proyecto esta organizado como un **monolito modular** con enfoque **hexagonal**.

La ruta activa del sistema esta en `src/`.

Cada modulo sigue esta idea:

- `domain`: entidades y contratos
- `application`: casos de uso
- `infrastructure`: implementaciones con Prisma o seguridad
- `dto`: datos de entrada
- `controller`: endpoints HTTP

## Modulos

- `auth`: login, JWT y RBAC
- `users`: registro y perfil
- `subscriptions`: planes y cambio de plan
- `interactions`: likes, dislikes y superlikes
- `matches`: creacion y consulta de matches
- `messages`: chat entre usuarios con match
- `prisma`: conexion unica a la base de datos
- `shared`: seguridad y utilidades comunes

## Base de datos

Se usa una sola base PostgreSQL y un solo `schema.prisma`.

Tablas principales:

- `User`
- `UserProfile`
- `UserPhoto`
- `UserInterest`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `SubscriptionPlan`
- `UserSubscription`
- `UserInteraction`
- `Match`
- `Message`

## RBAC

Roles implementados:

- `USER`
- `GOLD`
- `PREMIUM`
- `ADMIN`

Regla aplicada:

- `USER` es el rol base
- `GOLD` y `PREMIUM` se sincronizan con la suscripcion
- `ADMIN` se asigna manualmente

## Variables de entorno

Usa `.env` con estas variables base:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
JWT_SECRET="super-secret-change-this"
PORT=3000
```

Tambien tienes una referencia en `.env.example`.

## Scripts

```bash
npm install
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
npm run start:dev
```

## Endpoints principales

### Publicos

- `GET /`
- `POST /users`
- `POST /auth/login`
- `GET /subscriptions/plans`

### Protegidos

- `GET /auth/profile`
- `GET /auth/access/me`
- `GET /users`
- `GET /users/me`
- `PATCH /users/me`
- `GET /subscriptions/me`
- `PATCH /subscriptions/me`
- `POST /interactions`
- `GET /interactions/sent`
- `GET /matches`
- `POST /messages`
- `GET /messages/:matchId`

### Solo ADMIN

- `GET /auth/access/users`
- `PATCH /auth/access/users/:userId/roles`

## Pruebas en Postman

Resumen rapido:

1. Registrar dos usuarios con `POST /users`
2. Hacer login con `POST /auth/login`
3. Consultar `GET /subscriptions/me`
4. Hacer like mutuo con `POST /interactions`
5. Ver `GET /matches`
6. Enviar mensaje con `POST /messages`
7. Ver mensajes con `GET /messages/:matchId`

Guia mas detallada:

- [docs/postman-guide.md](docs/postman-guide.md)

## Estado del proyecto

Actualmente el backend ya funciona con:

- registro
- login con JWT
- bcrypt
- RBAC
- suscripciones
- likes / dislikes / superlikes
- match automatico
- mensajes por match
