"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: number;
  productTitle: string;
  productPrice: number;
  stock: number;
}

export default function AddToCartButton({ productId, productTitle, productPrice, stock }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const addToCart = async () => {
    if (stock === 0) {
      alert("این محصول موجود نیست");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        alert(`${productTitle} به سبد خرید اضافه شد`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در افزودن به سبد خرید");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* انتخاب تعداد */}
      <div className="flex items-center gap-4">
        <span className="text-zinc-400">تعداد:</span>
        <div className="flex items-center gap-3">
          <button
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={increaseQuantity}
            disabled={quantity >= stock}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* دکمه افزودن به سبد */}
      <button
        onClick={addToCart}
        disabled={loading || stock === 0}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "در حال افزودن..." : `افزودن به سبد خرید - ${(productPrice * quantity).toLocaleString("fa-IR")} تومان`}
      </button>
    </div>
  );
}