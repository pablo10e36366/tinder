-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'DISLIKE', 'SUPERLIKE');

-- CreateTable
CREATE TABLE "interaction_user_capabilities" (
    "user_id" INTEGER NOT NULL,
    "plan_code" VARCHAR(20) NOT NULL,
    "superlikes_per_day" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interaction_user_capabilities_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "interaction_daily_counters" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "counter_date" DATE NOT NULL,
    "superlikes_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interaction_daily_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" SERIAL NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "target_user_id" INTEGER NOT NULL,
    "type" "InteractionType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interaction_daily_counters_user_id_counter_date_key" ON "interaction_daily_counters"("user_id", "counter_date");

-- CreateIndex
CREATE INDEX "user_interactions_actor_user_id_type_created_at_idx" ON "user_interactions"("actor_user_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "user_interactions_target_user_id_type_created_at_idx" ON "user_interactions"("target_user_id", "type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_interactions_actor_user_id_target_user_id_key" ON "user_interactions"("actor_user_id", "target_user_id");
