"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

interface AddToCartButtonProps {
  productId: number;
  stock: number;
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (stock === 0) return;
    setLoading(true);
    try {
      await addToCart(productId, quantity);
      alert("محصول به سبد خرید اضافه شد");
    } catch (error) {
      console.error(error);
      alert("خطا در افزودن محصول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 flex gap-4 items-center">
      <input
        type="number"
        min={1}
        max={stock}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-24 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10"
      />
      <button
        onClick={handleAdd}
        disabled={stock === 0 || loading}
        className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "در حال افزودن..." : stock === 0 ? "ناموجود" : "افزودن به سبد خرید"}
      </button>
    </div>
  );
}