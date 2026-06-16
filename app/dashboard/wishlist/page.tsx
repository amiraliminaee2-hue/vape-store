"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WishlistProduct {
  id: number;
  title: string;
  price: number;
  stock: number;
  images: string[];
  isFeatured: boolean;
  slug: string;
}

interface WishlistItem {
  id: number;
  productId: number;
  createdAt: string;
  product: WishlistProduct;
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      setRemovingId(productId);
      await fetch("/api/wishlist/" + productId, { method: "DELETE" });
      await loadWishlist();
    } catch (error) {
      console.error(error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "خطا در افزودن به سبد");
        return;
      }
      alert("محصول به سبد خرید اضافه شد");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">علاقه‌مندی‌ها</h1>
        <p className="mt-2 text-zinc-500">
          {items.length} محصول در لیست علاقه‌مندی‌های شما
        </p>
      </div>

      {items.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            p-16
            text-center
          "
        >
          <p className="text-6xl mb-6">🤍</p>
          <p className="text-xl text-zinc-400">لیست علاقه‌مندی‌های شما خالی است</p>
          <Link
            href="/shop"
            className="
              inline-block
              mt-6
              px-8 py-3
              rounded-xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
            "
          >
            رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="
                rounded-3xl
                border border-white/10
                bg-white/[0.02]
                overflow-hidden
                hover:border-violet-500/30
                transition-all
              "
            >
              <div className="p-6">
                {item.product.isFeatured && (
                  <span className="inline-flex mb-3 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs">
                    ویژه
                  </span>
                )}

                <Link href={"/product/" + item.product.id}>
                  <h3 className="text-xl font-bold hover:text-violet-400 transition-colors">
                    {item.product.title}
                  </h3>
                </Link>

                <p className="mt-3 text-2xl font-bold text-violet-400">
                  {item.product.price.toLocaleString("fa-IR")} تومان
                </p>

                <p
                  className={
                    "mt-2 text-sm " +
                    (item.product.stock > 0 ? "text-green-400" : "text-red-400")
                  }
                >
                  {item.product.stock > 0
                    ? "موجود در انبار"
                    : "ناموجود"}
                </p>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={item.product.stock === 0}
                  className="
                    flex-1
                    py-3
                    rounded-xl
                    bg-violet-600
                    hover:bg-violet-500
                    transition-colors
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    text-sm
                  "
                >
                  افزودن به سبد
                </button>

                <button
                  onClick={() => handleRemove(item.product.id)}
                  disabled={removingId === item.product.id}
                  className="
                    px-4
                    py-3
                    rounded-xl
                    bg-red-500/10
                    hover:bg-red-500/20
                    text-red-400
                    transition-colors
                    disabled:opacity-50
                    text-sm
                  "
                >
                  {removingId === item.product.id ? "..." : "حذف"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}