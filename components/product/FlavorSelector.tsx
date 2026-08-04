// components/product/FlavorSelector.tsx
"use client";

import { useState, useEffect } from "react";

interface Flavor {
  id: number;
  name: string;
  stock: number;
  price: number | null;
  isActive: boolean;
}

interface FlavorSelectorProps {
  flavors: Flavor[];
  onFlavorChange: (flavorId: number | null, price: number) => void;
  selectedFlavorId?: number | null;
  quantity?: number;
}

export default function FlavorSelector({
  flavors,
  onFlavorChange,
  selectedFlavorId: initialSelectedId = null,
  quantity = 1,
}: FlavorSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  const activeFlavors = flavors.filter((f) => f.isActive);

  useEffect(() => {
    if (selectedId) {
      const flavor = activeFlavors.find((f) => f.id === selectedId);
      setSelectedPrice(flavor?.price || 0);
      onFlavorChange(selectedId, flavor?.price || 0);
    } else {
      setSelectedPrice(0);
      onFlavorChange(null, 0);
    }
  }, [selectedId, activeFlavors, onFlavorChange]);

  const handleSelect = (flavorId: number) => {
    if (selectedId === flavorId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(flavorId);
  };

  if (activeFlavors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-zinc-300">
        انتخاب طعم <span className="text-red-400">*</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {activeFlavors.map((flavor) => {
          const isSelected = selectedId === flavor.id;
          const isOutOfStock = flavor.stock <= 0;

          return (
            <button
              key={flavor.id}
              type="button"
              onClick={() => !isOutOfStock && handleSelect(flavor.id)}
              disabled={isOutOfStock}
              className={`
                px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium
                ${isSelected
                  ? "border-violet-500 bg-violet-500/20 text-violet-300"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-violet-500/50"
                }
                ${isOutOfStock
                  ? "opacity-50 cursor-not-allowed border-red-500/30 text-red-400"
                  : "cursor-pointer"
                }
              `}
            >
              {flavor.name}
              {flavor.price && flavor.price > 0 && (
                <span className="text-xs text-zinc-400 mr-1">
                  (+{flavor.price.toLocaleString("fa-IR")} تومان)
                </span>
              )}
              <span className={`text-xs mr-2 ${
                isOutOfStock ? "text-red-400" : "text-green-400"
              }`}>
                {isOutOfStock ? "(ناموجود)" : `(${flavor.stock} عدد)`}
              </span>
            </button>
          );
        })}
      </div>
      {selectedId && (
        <div className="text-sm text-violet-400 mt-1">
          طعم انتخاب شده: {activeFlavors.find((f) => f.id === selectedId)?.name}
          {selectedPrice > 0 && ` (+${selectedPrice.toLocaleString("fa-IR")} تومان)`}
        </div>
      )}
    </div>
  );
}