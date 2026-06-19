"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  phone: string | null;
  address: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  commission: number;
  totalSales: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  products: Product[];
}

interface EditFormData {
  storeName: string;
  description: string;
  phone: string;
  address: string;
  commission: number;
  status: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  SUSPENDED: "تعلیق شده",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300",
  APPROVED: "bg-emerald-500/20 text-emerald-300",
  REJECTED: "bg-red-500/20 text-red-300",
  SUSPENDED: "bg-orange-500/20 text-orange-300",
};

export default function SellerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.["id"] as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    storeName: "",
    description: "",
    phone: "",
    address: "",
    commission: 10,
    status: "PENDING",
  });

  // تعریف fetchSeller با useCallback
  const fetchSeller = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/admin/sellers?id=${id}`);
      const data: Seller = await res.json();
      setSeller(data);
      setEditForm({
        storeName: data.storeName || "",
        description: data.description || "",
        phone: data.phone || "",
        address: data.address || "",
        commission: data.commission || 10,
        status: data.status || "PENDING",
      });
    } catch (error) {
      console.error("Error fetching seller:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSeller();
    }
  }, [id, fetchSeller]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (): Promise<void> => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/sellers?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        alert("اطلاعات فروشنده با موفقیت به‌روز شد");
        setIsEditing(false);
        fetchSeller();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در به‌روزرسانی");
      }
    } catch (error) {
      console.error("Error updating seller:", error);
      alert("خطا در به‌روزرسانی");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/sellers?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        alert(`وضعیت فروشنده به "${statusLabels[newStatus]}" تغییر کرد`);
        fetchSeller();
      } else {
        alert("خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("خطا در تغییر وضعیت");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-10">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen p-10">
        <div className="text-center">فروشنده یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="
                w-10 h-10
                rounded-full
                border border-white/10
                flex items-center justify-center
                hover:border-white/30
                transition-colors
              "
            >
              →
            </button>
            <h1 className="text-3xl font-bold">{seller.storeName}</h1>
            <span
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${statusColors[seller.status]}
              `}
            >
              {statusLabels[seller.status]}
            </span>
          </div>

          <div className="flex gap-3">
            {seller.status !== "APPROVED" && (
              <button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm font-medium disabled:opacity-50"
              >
                تأیید فروشنده
              </button>
            )}
            {seller.status !== "REJECTED" && (
              <button
                onClick={() => handleStatusChange("REJECTED")}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition-colors text-sm font-medium disabled:opacity-50"
              >
                رد فروشنده
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">اطلاعات کاربر</h2>
              <Link
                href={`/admin/users/${seller.userId}`}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                مشاهده جزئیات کاربر →
              </Link>
            </div>
            <div className="space-y-2">
              <p>
                <span className="text-zinc-500">نام کاربری:</span>{" "}
                {seller.user.name || "-"}
              </p>
              <p>
                <span className="text-zinc-500">ایمیل:</span> {seller.user.email}
              </p>
              <p>
                <span className="text-zinc-500">شناسه کاربر:</span> {seller.userId}
              </p>
            </div>
          </div>

          {/* Store Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">اطلاعات فروشگاه</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                {isEditing ? "انصراف" : "✏️ ویرایش"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">نام فروشگاه</label>
                  <input
                    type="text"
                    name="storeName"
                    value={editForm.storeName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">slug</label>
                  <input
                    type="text"
                    value={seller.slug}
                    disabled
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">slug قابل تغییر نیست</p>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">توضیحات</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">شماره تماس</label>
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">کمیسیون (%)</label>
                    <input
                      type="number"
                      name="commission"
                      value={editForm.commission}
                      onChange={handleEditChange}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">آدرس</label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">وضعیت</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50 cursor-pointer"
                  >
                    <option value="PENDING">در انتظار تأیید</option>
                    <option value="APPROVED">تأیید شده</option>
                    <option value="REJECTED">رد شده</option>
                    <option value="SUSPENDED">تعلیق شده</option>
                  </select>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50"
                >
                  {updating ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-sm">نام فروشگاه</p>
                    <p className="font-medium">{seller.storeName}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">slug</p>
                    <p className="text-violet-400">{seller.slug}</p>
                  </div>
                </div>

                {seller.description && (
                  <div>
                    <p className="text-zinc-500 text-sm">توضیحات</p>
                    <p className="text-zinc-300">{seller.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {seller.phone && (
                    <div>
                      <p className="text-zinc-500 text-sm">شماره تماس</p>
                      <p>{seller.phone}</p>
                    </div>
                  )}
                  {seller.address && (
                    <div>
                      <p className="text-zinc-500 text-sm">آدرس</p>
                      <p>{seller.address}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-sm">کمیسیون</p>
                    <p>{seller.commission}%</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">مجموع فروش</p>
                    <p className="text-emerald-400">{seller.totalSales.toLocaleString("fa-IR")} تومان</p>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-500 text-sm">مجموع درآمد فروشنده</p>
                  <p className="text-violet-400">{seller.totalEarned.toLocaleString("fa-IR")} تومان</p>
                </div>

                <div>
                  <p className="text-zinc-500 text-sm">تاریخ ثبت</p>
                  <p>{new Date(seller.createdAt).toLocaleDateString("fa-IR")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">محصولات فروشنده</h2>
              <Link
                href={`/admin/products?sellerId=${seller.id}`}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                مشاهده همه ({seller.products.length}) →
              </Link>
            </div>

            {seller.products.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">هیچ محصولی ثبت نشده است</p>
            ) : (
              <div className="space-y-2">
                {seller.products.slice(0, 5).map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-white/5"
                  >
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-zinc-500">
                        {product.price.toLocaleString("fa-IR")} تومان
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.isActive
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {product.isActive ? "فعال" : "غیرفعال"}
                      </span>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-violet-400 text-sm hover:text-violet-300"
                      >
                        ویرایش
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}