-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'ORGANIZATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clubMembership" BOOLEAN DEFAULT false,
ADD COLUMN     "clubName" TEXT,
ADD COLUMN     "distributionArea" TEXT,
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "otherDetails" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "seedsDonatedCount" INTEGER;
