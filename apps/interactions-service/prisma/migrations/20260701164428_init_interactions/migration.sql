-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'DISLIKE', 'SUPERLIKE');

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "type" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInteraction_fromUserId_type_idx" ON "UserInteraction"("fromUserId", "type");

-- CreateIndex
CREATE INDEX "UserInteraction_toUserId_type_idx" ON "UserInteraction"("toUserId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserInteraction_fromUserId_toUserId_key" ON "UserInteraction"("fromUserId", "toUserId");
