-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'GOLD', 'PREMIUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
