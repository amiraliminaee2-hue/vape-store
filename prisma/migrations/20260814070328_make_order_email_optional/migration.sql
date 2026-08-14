/*
  Warnings:

  - You are about to drop the column `userEmail` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "userEmail";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "OrderItemFlavor" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "flavorId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItemFlavor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItemFlavor_flavorId_idx" ON "OrderItemFlavor"("flavorId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItemFlavor_orderItemId_flavorId_key" ON "OrderItemFlavor"("orderItemId", "flavorId");

-- AddForeignKey
ALTER TABLE "OrderItemFlavor" ADD CONSTRAINT "OrderItemFlavor_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemFlavor" ADD CONSTRAINT "OrderItemFlavor_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
