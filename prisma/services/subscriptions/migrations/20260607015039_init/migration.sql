-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('FREE', 'GOLD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "superlikes_per_day" INTEGER,
    "features" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_code" "SubscriptionPlanCode" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_status_idx" ON "user_subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_started_at_idx" ON "user_subscriptions"("user_id", "started_at");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_code_fkey" FOREIGN KEY ("plan_code") REFERENCES "subscription_plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
