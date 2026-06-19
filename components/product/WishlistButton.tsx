"use client";

import { useState, useEffect, useCallback } from "react";

interface WishlistItem {
  id: number;
  productId: number;
  userId: string;
  createdAt: string;
}

interface WishlistButtonProps {
  productId: number;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // بررسی اولیه: آیا محصول در علاقه‌مندی‌ها هست؟
  const checkWishlistStatus = useCallback(async () => {
    try {
      console.log("🔍 Checking wishlist for product:", productId);
      const res = await fetch("/api/wishlist");
      console.log("📡 Wishlist API response status:", res.status);
      
      if (res.ok) {
        const items: WishlistItem[] = await res.json();
        console.log("📦 Wishlist items:", items);
        const exists = items.some((item) => item.productId === productId);
        console.log(`✅ Product ${productId} in wishlist:`, exists);
        setWishlisted(exists);
      } else if (res.status === 401) {
        console.log("🔐 User not authenticated");
        setWishlisted(false);
      }
    } catch (error) {
      console.error("❌ Error checking wishlist:", error);
    }
  }, [productId]);

  // بعد از mount شدن در کلاینت
  useEffect(() => {
    console.log("🔄 Component mounted");
    setMounted(true);
    checkWishlistStatus();
  }, [checkWishlistStatus]);

  const handleWishlist = async () => {
    if (loading) {
      console.log("⏳ Already loading, skipping...");
      return;
    }
    
    console.log("🖱️ Button clicked, current wishlisted state:", wishlisted);
    setLoading(true);
    
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      
      console.log("📡 Toggle API response status:", res.status);
      const data = await res.json();
      console.log("📦 Toggle API response data:", data);
      
      if (res.status === 401) {
        alert("ابتدا وارد حساب کاربری شوید");
        return;
      }
      
      // وضعیت واقعی برگشتی از API رو ذخیره کن
      setWishlisted(data.added);
      console.log(`✅ New wishlisted state: ${data.added}`);
      alert(data.added ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد");
      
    } catch (error) {
      console.error("❌ Error toggling wishlist:", error);
      alert("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <button
        disabled
        className="flex-shrink-0 mr-4 p-3 rounded-xl border border-white/10 text-2xl opacity-50"
        suppressHydrationWarning
      >
        🤍
      </button>
    );
  }

  return (
    <button
      onClick={handleWishlist}
      disabled={loading}
      title={wishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      className="flex-shrink-0 mr-4 p-3 rounded-xl border border-white/10 hover:border-violet-500/50 transition-all text-2xl disabled:opacity-50"
      suppressHydrationWarning
    >
      {loading ? "⏳" : (wishlisted ? "❤️" : "🤍")}
    </button>
  );
}