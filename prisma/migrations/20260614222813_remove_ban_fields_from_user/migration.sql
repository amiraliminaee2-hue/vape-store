/*
  Warnings:

  - You are about to drop the column `banExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `banReason` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bannedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "banExpiry",
DROP COLUMN "banReason",
DROP COLUMN "bannedAt";
