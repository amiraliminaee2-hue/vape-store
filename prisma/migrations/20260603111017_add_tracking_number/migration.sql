/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trackingNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userEmail` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userName` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "trackingNumber" TEXT,
ALTER COLUMN "userEmail" SET NOT NULL,
ALTER COLUMN "userName" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingNumber_key" ON "Order"("trackingNumber");
