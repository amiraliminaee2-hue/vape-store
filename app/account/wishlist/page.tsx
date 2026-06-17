"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface WishlistProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
}

interface WishlistItem {
  id: number;
  productId: number;
  createdAt: string;
  product: WishlistProduct;
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // بررسی احراز هویت
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const loadWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      const data: WishlistItem[] = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadWishlist();
    }
  }, [status]);

  const handleRemove = async (productId: number) => {
    try {
      setRemovingId(productId);
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await loadWishlist();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف از علاقه‌مندی‌ها");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("خطا در حذف از علاقه‌مندی‌ها");
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
      console.error("Error adding to cart:", error);
      alert("خطا در افزودن به سبد خرید");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">علاقه‌مندی‌ها</h1>
        <p className="mt-2 text-zinc-500">
          {items.length} محصول در لیست علاقه‌مندی‌های شما
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-white/10 rounded-3xl">
          <p className="text-6xl mb-4">🤍</p>
          <p className="text-xl text-zinc-400">لیست علاقه‌مندی‌های شما خالی است</p>
          <Link
            href="/shop"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item: WishlistItem) => (
            <div
              key={item.id}
              className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] hover:border-violet-500/30 transition-all"
            >
              <Link href={`/product/${item.product.slug || item.product.id}`}>
                <div className="aspect-square relative bg-zinc-900/50">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
                      🖼️
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/product/${item.product.slug || item.product.id}`}>
                  <h3 className="font-semibold hover:text-violet-400 transition-colors line-clamp-1">
                    {item.product.title}
                  </h3>
                </Link>
                <p className="mt-2 text-lg font-bold text-violet-400">
                  {item.product.price.toLocaleString("fa-IR")} تومان
                </p>
                <p className={`text-sm ${item.product.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                  {item.product.stock > 0 ? "موجود در انبار" : "ناموجود"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item.productId)}
                    disabled={item.product.stock === 0}
                    className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    افزودن به سبد
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingId === item.productId}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm disabled:opacity-50"
                  >
                    {removingId === item.productId ? "..." : "🗑️"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}