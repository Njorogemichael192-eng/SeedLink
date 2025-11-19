-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('INDIVIDUAL', 'INSTITUTION', 'CLUB');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingType" "BookingType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "clubEmail" TEXT,
ADD COLUMN     "clubInstitutionName" TEXT,
ADD COLUMN     "clubName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "institutionEmail" TEXT,
ADD COLUMN     "institutionName" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialRequest" TEXT;

-- CreateTable
CREATE TABLE "RestockSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "seedlingType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestockSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestockSubscription_stationId_seedlingType_idx" ON "RestockSubscription"("stationId", "seedlingType");

-- CreateIndex
CREATE UNIQUE INDEX "RestockSubscription_userId_stationId_seedlingType_key" ON "RestockSubscription"("userId", "stationId", "seedlingType");

-- AddForeignKey
ALTER TABLE "RestockSubscription" ADD CONSTRAINT "RestockSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestockSubscription" ADD CONSTRAINT "RestockSubscription_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "SeedlingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
