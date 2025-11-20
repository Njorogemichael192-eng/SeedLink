-- CreateTable
CREATE TABLE "GrowthTrackerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "aiHealthDiagnosis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthTrackerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthTrackerEntry_userId_idx" ON "GrowthTrackerEntry"("userId");

-- CreateIndex
CREATE INDEX "GrowthTrackerEntry_plantingDate_idx" ON "GrowthTrackerEntry"("plantingDate");

-- AddForeignKey
ALTER TABLE "GrowthTrackerEntry" ADD CONSTRAINT "GrowthTrackerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
