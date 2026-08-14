-- CreateTable
CREATE TABLE "Flavor" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flavor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItemFlavor" (
    "id" SERIAL NOT NULL,
    "cartItemId" INTEGER NOT NULL,
    "flavorId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,

    CONSTRAINT "CartItemFlavor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flavor_productId_idx" ON "Flavor"("productId");

-- CreateIndex
CREATE INDEX "Flavor_isActive_idx" ON "Flavor"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Flavor_productId_name_key" ON "Flavor"("productId", "name");

-- CreateIndex
CREATE INDEX "CartItemFlavor_flavorId_idx" ON "CartItemFlavor"("flavorId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItemFlavor_cartItemId_flavorId_key" ON "CartItemFlavor"("cartItemId", "flavorId");

-- AddForeignKey
ALTER TABLE "Flavor" ADD CONSTRAINT "Flavor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemFlavor" ADD CONSTRAINT "CartItemFlavor_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemFlavor" ADD CONSTRAINT "CartItemFlavor_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
