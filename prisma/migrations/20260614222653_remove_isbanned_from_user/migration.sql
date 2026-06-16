-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpiry" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3);
