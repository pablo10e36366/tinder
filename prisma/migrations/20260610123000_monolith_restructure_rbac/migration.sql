-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('USER', 'GOLD', 'PREMIUM', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('FREE', 'GOLD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- Alter existing tables first so current data can be transformed safely
ALTER TYPE "SubscriptionPlan" RENAME TO "LegacySubscriptionPlan";

ALTER TABLE "Match"
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "User"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User"
SET "passwordHash" = "password",
    "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "User"
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- New normalized tables
CREATE TABLE "UserProfile" (
    "userId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "age" INTEGER,
    "bio" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "UserPhoto" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "interest" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPlan" (
    "id" SERIAL NOT NULL,
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "superLikesPerDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- Migrate user profile data out of the old User table
INSERT INTO "UserProfile" (
    "userId",
    "displayName",
    "age",
    "bio",
    "location",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "age",
    "bio",
    "location",
    "createdAt",
    "updatedAt"
FROM "User";

INSERT INTO "UserPhoto" ("userId", "url", "sortOrder", "isPrimary", "createdAt")
SELECT
    u."id",
    p."url",
    p."ordinality" - 1,
    p."ordinality" = 1,
    u."createdAt"
FROM "User" u
CROSS JOIN LATERAL unnest(COALESCE(u."photos", ARRAY[]::TEXT[])) WITH ORDINALITY AS p("url", "ordinality");

INSERT INTO "UserInterest" ("userId", "interest", "createdAt")
SELECT
    u."id",
    i."interest",
    u."createdAt"
FROM "User" u
CROSS JOIN LATERAL unnest(COALESCE(u."interests", ARRAY[]::TEXT[])) AS i("interest");

-- Seed RBAC
INSERT INTO "Role" ("code", "name", "description") VALUES
('USER', 'User', 'Usuario autenticado del sistema'),
('GOLD', 'Gold', 'Usuario con suscripcion Gold'),
('PREMIUM', 'Premium', 'Usuario con suscripcion Premium'),
('ADMIN', 'Admin', 'Administrador del sistema');

INSERT INTO "Permission" ("code", "name", "description") VALUES
('users.read.self', 'Leer perfil propio', 'Permite ver el perfil autenticado'),
('users.update.self', 'Actualizar perfil propio', 'Permite actualizar el perfil autenticado'),
('users.read.all', 'Leer todos los usuarios', 'Permite listar usuarios'),
('subscriptions.read.self', 'Leer suscripcion propia', 'Permite ver la suscripcion actual'),
('subscriptions.update.self', 'Actualizar suscripcion propia', 'Permite cambiar la suscripcion'),
('interactions.create', 'Crear interacciones', 'Permite crear likes, dislikes y superlikes'),
('interactions.read.self', 'Leer interacciones propias', 'Permite ver interacciones enviadas'),
('matches.read.self', 'Leer matches propios', 'Permite ver matches propios'),
('messages.create', 'Enviar mensajes', 'Permite enviar mensajes en matches'),
('messages.read.self', 'Leer mensajes propios', 'Permite ver mensajes de un match'),
('roles.assign', 'Asignar roles', 'Permite administrar roles de usuarios');

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
JOIN "Permission" p ON p."code" IN (
    'users.read.self',
    'users.update.self',
    'subscriptions.read.self',
    'subscriptions.update.self',
    'interactions.create',
    'interactions.read.self',
    'matches.read.self',
    'messages.create',
    'messages.read.self'
)
WHERE r."code" IN ('USER', 'GOLD', 'PREMIUM');

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
JOIN "Permission" p ON p."code" IN ('users.read.all', 'roles.assign')
WHERE r."code" = 'ADMIN';

-- Seed subscription plans
INSERT INTO "SubscriptionPlan" (
    "code",
    "name",
    "description",
    "superLikesPerDay",
    "createdAt",
    "updatedAt"
) VALUES
('FREE', 'Free', 'Plan basico con funciones esenciales', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GOLD', 'Gold', 'Mas visibilidad y mas interacciones premium', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PREMIUM', 'Premium', 'Experiencia completa sin limite de superlikes', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "UserSubscription" (
    "userId",
    "planId",
    "status",
    "startedAt",
    "createdAt"
)
SELECT
    u."id",
    sp."id",
    'ACTIVE'::"SubscriptionStatus",
    u."createdAt",
    u."createdAt"
FROM "User" u
JOIN "SubscriptionPlan" sp ON sp."code" = (u."plan"::TEXT)::"SubscriptionPlanCode";

INSERT INTO "UserRole" ("userId", "roleId", "assignedAt")
SELECT
    u."id",
    r."id",
    u."createdAt"
FROM "User" u
JOIN "Role" r ON r."code" = 'USER';

INSERT INTO "UserRole" ("userId", "roleId", "assignedAt")
SELECT
    u."id",
    r."id",
    u."createdAt"
FROM "User" u
JOIN "Role" r ON r."code" = (u."plan"::TEXT)::"RoleCode"
WHERE u."plan" IN ('GOLD'::"LegacySubscriptionPlan", 'PREMIUM'::"LegacySubscriptionPlan");

-- Remove denormalized columns from User
ALTER TABLE "User"
DROP COLUMN "age",
DROP COLUMN "bio",
DROP COLUMN "interests",
DROP COLUMN "location",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "photos",
DROP COLUMN "plan";

DROP TYPE "LegacySubscriptionPlan";

-- Indexes
CREATE UNIQUE INDEX "UserPhoto_userId_sortOrder_key" ON "UserPhoto"("userId", "sortOrder");
CREATE UNIQUE INDEX "UserInterest_userId_interest_key" ON "UserInterest"("userId", "interest");
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");
CREATE INDEX "UserSubscription_userId_status_startedAt_idx" ON "UserSubscription"("userId", "status", "startedAt");

-- Foreign keys
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
