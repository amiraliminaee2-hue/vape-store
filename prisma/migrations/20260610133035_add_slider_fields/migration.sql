-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "show_in_best_selling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_disposable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_girls" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_liquids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_packs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_in_permanent" BOOLEAN NOT NULL DEFAULT false;
