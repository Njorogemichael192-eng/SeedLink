-- CreateEnum
CREATE TYPE "GrowthReminderFrequency" AS ENUM ('EVERY_3_DAYS', 'WEEKLY', 'EVERY_14_DAYS', 'MONTHLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "growthReminderFrequency" "GrowthReminderFrequency",
ADD COLUMN     "growthReminderLastSentAt" TIMESTAMP(3);
