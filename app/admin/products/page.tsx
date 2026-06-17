"use client";

import { JSX, useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  name: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercent: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  showInBestSelling: boolean;
  showInFeatured: boolean;
  showInPermanent: boolean;
  showInDisposable: boolean;
  showInPacks: boolean;
  showInGirls: boolean;
  showInLiquids: boolean;
  category: Category;
}

interface DiscountModal {
  isOpen: boolean;
  productId: number | null;
  currentDiscount: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [discountModal, setDiscountModal] = useState<DiscountModal>({
    isOpen: false,
    productId: null,
    currentDiscount: 0,
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [updatingDiscount, setUpdatingDiscount] = useState<boolean>(false);
  const [updatingSlider, setUpdatingSlider] = useState<number | null>(null);

  const fetchProducts = async (mountedRef?: { current: boolean }): Promise<void> => {
    try {
      const res = await fetch("/api/products?limit=100");
      const data: { products: Product[] } = await res.json();

      if (!mountedRef || mountedRef.current) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      if (!mountedRef || mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const mountedRef = { current: true };
    void fetchProducts(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleDelete = async (id: number): Promise<void> => {
    const confirmed = confirm("آیا مطمئنی؟ این محصول حذف میشه.");
    if (!confirmed) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p: Product) => p.id !== id));
      } else {
        alert("خطا در حذف محصول");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("خطا در حذف محصول");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (format: "xlsx" | "csv"): Promise<void> => {
    setExporting(true);
    try {
      window.open(`/api/admin/reports/export?type=products&format=${format}`, "_blank");
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const openDiscountModal = (product: Product): void => {
    setDiscountModal({
      isOpen: true,
      productId: product.id,
      currentDiscount: product.discountPercent || 0,
    });
    setDiscountPercent(product.discountPercent || 0);
  };

  const closeDiscountModal = (): void => {
    setDiscountModal({ isOpen: false, productId: null, currentDiscount: 0 });
    setDiscountPercent(0);
  };

  const applyDiscount = async (): Promise<void> => {
    if (!discountModal.productId) return;

    if (discountPercent < 0 || discountPercent > 100) {
      alert("درصد تخفیف باید بین 0 تا 100 باشد");
      return;
    }

    setUpdatingDiscount(true);
    try {
      const res = await fetch("/api/admin/products/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: discountModal.productId,
          discountPercent: discountPercent,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p: Product) =>
            p.id === discountModal.productId
              ? { ...p, discountPercent: discountPercent }
              : p
          )
        );
        alert("تخفیف با موفقیت اعمال شد");
        closeDiscountModal();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در اعمال تخفیف");
      }
    } catch (error) {
      console.error("Discount error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setUpdatingDiscount(false);
    }
  };

  const updateSliderField = async (productId: number, field: string, value: boolean): Promise<void> => {
    setUpdatingSlider(productId);
    try {
      const res = await fetch("/api/admin/products/slider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          field,
          value,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p: Product) =>
            p.id === productId
              ? { ...p, [field]: value }
              : p
          )
        );
        alert("محصول با موفقیت منتقل شد");
      } else {
        alert("خطا در انتقال محصول");
      }
    } catch (error) {
      console.error("Slider update error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setUpdatingSlider(null);
    }
  };

  const formatPriceWithDiscount = (price: number, discountPercent: number): JSX.Element => {
    if (!discountPercent || discountPercent <= 0) {
      return <span>{price.toLocaleString("fa-IR")} تومان</span>;
    }
    const discountedPrice = price - (price * discountPercent / 100);
    return (
      <div className="flex flex-col">
        <span className="text-xs text-zinc-500 line-through">{price.toLocaleString("fa-IR")} تومان</span>
        <span className="text-sm text-green-400">{discountedPrice.toLocaleString("fa-IR")} تومان</span>
        <span className="text-xs text-red-400">({discountPercent}% تخفیف)</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">محصولات</h1>
          <p className="mt-2 text-zinc-500">
            {products.length} محصول در دیتابیس
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              className="px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
            >
              📊 خروجی Excel
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
            >
              📄 خروجی CSV
            </button>
          </div>
          <Link
            href="/admin/products/new"
            className="
              px-6 py-3
              rounded-full
              bg-violet-600
              hover:bg-violet-500
              transition-colors
              font-medium
              text-sm
            "
          >
            + افزودن محصول
          </Link>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i: number) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          محصولی وجود ندارد
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product: Product) => (
            <div key={product.id} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* اطلاعات اصلی */}
                <div>
                  <p className="text-sm text-zinc-500">نام محصول</p>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-zinc-500 mt-2">دسته‌بندی</p>
                  <p className="text-sm">{product.category.name}</p>
                </div>

                {/* قیمت و موجودی */}
                <div>
                  <p className="text-sm text-zinc-500">قیمت</p>
                  <div>{formatPriceWithDiscount(product.price, product.discountPercent)}</div>
                  <p className="text-sm text-zinc-500 mt-2">موجودی</p>
                  <p className={`text-sm font-medium ${
                    product.stock === 0
                      ? "text-red-400"
                      : product.stock <= 5
                      ? "text-amber-400"
                      : "text-green-400"
                  }`}>
                    {product.stock === 0 ? "ناموجود" : `${product.stock} عدد`}
                  </p>
                </div>

                {/* دکمه‌های اسلایدر */}
                <div>
                  <p className="text-sm text-zinc-500 mb-2">نمایش در اسلایدرها</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateSliderField(product.id, "showInBestSelling", !product.showInBestSelling)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInBestSelling
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      🏆 پرفروش
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInFeatured", !product.showInFeatured)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInFeatured
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      ⭐ بهترین‌ها
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInPermanent", !product.showInPermanent)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInPermanent
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      ⚡ پاد دائمی
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInDisposable", !product.showInDisposable)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInDisposable
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      🔄 یکبار مصرف
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInPacks", !product.showInPacks)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInPacks
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      📦 پک‌ها
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInGirls", !product.showInGirls)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInGirls
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      💖 دخترونه
                    </button>
                    <button
                      onClick={() => updateSliderField(product.id, "showInLiquids", !product.showInLiquids)}
                      disabled={updatingSlider === product.id}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        product.showInLiquids
                          ? "bg-green-600/30 text-green-400 border border-green-500/50"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      🧪 لیکوئیدها
                    </button>
                  </div>
                </div>

                {/* عملیات */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openDiscountModal(product)}
                    className="px-3 py-1.5 rounded-full bg-green-600/20 text-green-400 text-sm hover:bg-green-600/30 transition-all"
                  >
                    🏷️ تخفیف
                  </button>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="px-3 py-1.5 rounded-full border border-white/10 text-sm hover:border-violet-500/50 hover:text-violet-300 transition-all text-center"
                  >
                    ✏️ ویرایش
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 hover:border-red-500/40 transition-all disabled:opacity-50"
                  >
                    {deletingId === product.id ? "..." : "🗑️ حذف"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal تخفیف */}
      {discountModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">اعمال تخفیف</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">درصد تخفیف (0 تا 100)</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountPercent(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  placeholder="مثال: 20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={applyDiscount}
                  disabled={updatingDiscount}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
                >
                  {updatingDiscount ? "در حال اعمال..." : "اعمال تخفیف"}
                </button>
                <button
                  onClick={closeDiscountModal}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}