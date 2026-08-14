"use client";

import { useMemo, useState } from "react";
import FlavorSelector from "@/components/product/FlavorSelector";
import AddToCartButton from "@/components/ui/AddToCartButton";

interface Flavor {
  id: number;
  name: string;
  stock: number;
  price: number | null;
  isActive: boolean;
}

interface ProductActionsProps {
  productId: number;
  productTitle: string;
  productPrice: number;
  stock: number;
  flavors: Flavor[];
}

export default function ProductActions({
  productId,
  productTitle,
  productPrice,
  stock,
  flavors,
}: ProductActionsProps) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<
    number | null
  >(null);

  const [selectedFlavorPrice, setSelectedFlavorPrice] =
    useState<number>(0);

  const activeFlavors = useMemo(
    () => flavors.filter((flavor) => flavor.isActive),
    [flavors]
  );

  const selectedFlavor = useMemo(() => {
    if (selectedFlavorId === null) {
      return null;
    }

    return (
      activeFlavors.find(
        (flavor) => flavor.id === selectedFlavorId
      ) ?? null
    );
  }, [activeFlavors, selectedFlavorId]);

  const handleFlavorChange = (
    flavorId: number | null,
    price: number
  ) => {
    setSelectedFlavorId(flavorId);
    setSelectedFlavorPrice(price);
  };

  const finalPrice =
    productPrice + selectedFlavorPrice;

  const finalStock =
    selectedFlavor !== null
      ? Math.min(stock, selectedFlavor.stock)
      : stock;

  return (
    <div className="space-y-6">
      {activeFlavors.length > 0 && (
        <div className="mt-4">
          <FlavorSelector
            flavors={flavors}
            onFlavorChange={handleFlavorChange}
            selectedFlavorId={selectedFlavorId}
          />
        </div>
      )}

      <AddToCartButton
        productId={productId}
        productTitle={productTitle}
        productPrice={finalPrice}
        stock={finalStock}
        flavorId={selectedFlavorId}
        requiresFlavor={activeFlavors.length > 0}
      />
    </div>
  );
}