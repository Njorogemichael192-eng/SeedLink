-- CreateTable
CREATE TABLE "PostAttendance" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostAttendance_postId_idx" ON "PostAttendance"("postId");

-- CreateIndex
CREATE INDEX "PostAttendance_userId_idx" ON "PostAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAttendance_postId_userId_key" ON "PostAttendance"("postId", "userId");

-- AddForeignKey
ALTER TABLE "PostAttendance" ADD CONSTRAINT "PostAttendance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttendance" ADD CONSTRAINT "PostAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
