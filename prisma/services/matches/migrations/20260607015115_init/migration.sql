-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');

-- CreateTable
CREATE TABLE "match_user_snapshots" (
    "user_id" INTEGER NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "primary_photo_url" VARCHAR(500),
    "location" VARCHAR(150),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "match_user_snapshots_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "user_a_id" INTEGER NOT NULL,
    "user_b_id" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_interaction_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_user_a_id_status_idx" ON "matches"("user_a_id", "status");

-- CreateIndex
CREATE INDEX "matches_user_b_id_status_idx" ON "matches"("user_b_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_a_id_user_b_id_key" ON "matches"("user_a_id", "user_b_id");
