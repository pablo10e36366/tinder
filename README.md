# Tinder Backend

Backend tipo Tinder construido con NestJS, TypeScript, Prisma y PostgreSQL.

## Arquitectura

Actualmente el repo tiene dos partes:

- `src/`: monolito modular original
- `apps/`: migracion activa a microservicios con Nest

La nueva separacion de microservicios ya esta concentrada en `apps/`.

Cada modulo sigue esta idea:

- `domain`: entidades y contratos
- `application`: casos de uso
- `infrastructure`: implementaciones con Prisma o seguridad
- `dto`: datos de entrada
- `controller`: endpoints HTTP

## Servicios / modulos

- `auth`: login, JWT y RBAC
- `users`: registro y perfil
- `subscriptions`: planes y cambio de plan
- `interactions`: likes, dislikes y superlikes
- `matches`: creacion y consulta de matches
- `messages`: chat entre usuarios con match
- `libs/common`: contratos, DTOs compartidos y patrones de mensajes

## Base de datos

Hoy el proyecto puede seguir funcionando con una sola `DATABASE_URL`, pero ya
quedo preparado para usar URLs por microservicio:

- `AUTH_DATABASE_URL`
- `USERS_DATABASE_URL`
- `SUBSCRIPTIONS_DATABASE_URL`
- `INTERACTIONS_DATABASE_URL`
- `MATCHES_DATABASE_URL`
- `MESSAGES_DATABASE_URL`

Por ahora el cliente Prisma sigue usando el mismo esquema general de Prisma,
pero cada microservicio que toca datos ya tiene su propio `PrismaService`.

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
API_GATEWAY_PORT=3000
AUTH_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
USERS_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
SUBSCRIPTIONS_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
INTERACTIONS_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
MATCHES_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
MESSAGES_DATABASE_URL="postgresql://postgres:123456@localhost:5432/database_tinder"
AUTH_SERVICE_PORT=3001
USERS_SERVICE_PORT=3002
SUBSCRIPTIONS_SERVICE_PORT=3003
INTERACTIONS_SERVICE_PORT=3004
MATCHES_SERVICE_PORT=3005
MESSAGES_SERVICE_PORT=3006
```

Tambien tienes una referencia en `.env.example`.

## Scripts

```bash
npm install
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
npm run start:dev
npm run start:gateway:dev
npm run start:users-service:dev
```

## Workspace de microservicios

La base inicial para Nest Microservices ya existe en:

- `apps/api-gateway`
- `apps/auth-service`
- `apps/users-service`
- `apps/subscriptions-service`
- `apps/interactions-service`
- `apps/matches-service`
- `apps/messages-service`
- `libs/common`

En este punto:

- `api-gateway` levanta como app HTTP
- `auth-service` levanta como microservicio TCP
- `users-service` levanta como microservicio TCP
- `subscriptions-service` levanta como microservicio TCP
- `interactions-service` levanta como microservicio TCP
- `matches-service` levanta como microservicio TCP
- `messages-service` levanta como microservicio TCP

Ademas:

- cada servicio ya tiene su `main.ts`
- la comunicacion interna ya usa `ClientProxy` y `@MessagePattern()`
- `users`, `interactions`, `matches` y `messages` ya tienen su `PrismaService` local

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
