-- CreateTable
CREATE TABLE "UssdUser" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "county" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UssdUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "ussdUserId" TEXT,
    "currentFlow" TEXT,
    "currentStep" TEXT,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UssdSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdBooking" (
    "id" TEXT NOT NULL,
    "ussdUserId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "seedlingType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledPickup" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UssdBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdEventRegistration" (
    "id" TEXT NOT NULL,
    "ussdUserId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UssdEventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "categories" TEXT[],
    "duration" TEXT,
    "author" TEXT,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserContentInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,

    CONSTRAINT "UserContentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UssdUser_phoneNumber_key" ON "UssdUser"("phoneNumber");

-- CreateIndex
CREATE INDEX "UssdUser_phoneNumber_idx" ON "UssdUser"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UssdSession_sessionId_key" ON "UssdSession"("sessionId");

-- CreateIndex
CREATE INDEX "UssdSession_phoneNumber_idx" ON "UssdSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "UssdSession_isActive_idx" ON "UssdSession"("isActive");

-- CreateIndex
CREATE INDEX "UssdBooking_ussdUserId_idx" ON "UssdBooking"("ussdUserId");

-- CreateIndex
CREATE INDEX "UssdBooking_stationId_idx" ON "UssdBooking"("stationId");

-- CreateIndex
CREATE INDEX "UssdEventRegistration_eventId_idx" ON "UssdEventRegistration"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "UssdEventRegistration_ussdUserId_eventId_key" ON "UssdEventRegistration"("ussdUserId", "eventId");

-- CreateIndex
CREATE INDEX "ContentItem_publishDate_idx" ON "ContentItem"("publishDate");

-- CreateIndex
CREATE INDEX "UserContentInteraction_userId_idx" ON "UserContentInteraction"("userId");

-- CreateIndex
CREATE INDEX "UserContentInteraction_contentId_idx" ON "UserContentInteraction"("contentId");

-- AddForeignKey
ALTER TABLE "UssdSession" ADD CONSTRAINT "UssdSession_ussdUserId_fkey" FOREIGN KEY ("ussdUserId") REFERENCES "UssdUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UssdBooking" ADD CONSTRAINT "UssdBooking_ussdUserId_fkey" FOREIGN KEY ("ussdUserId") REFERENCES "UssdUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UssdBooking" ADD CONSTRAINT "UssdBooking_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "SeedlingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UssdEventRegistration" ADD CONSTRAINT "UssdEventRegistration_ussdUserId_fkey" FOREIGN KEY ("ussdUserId") REFERENCES "UssdUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UssdEventRegistration" ADD CONSTRAINT "UssdEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentInteraction" ADD CONSTRAINT "UserContentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentInteraction" ADD CONSTRAINT "UserContentInteraction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
