"use client";

import { useState, useEffect, JSX } from "react";
import Link from "next/link";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

interface FormData {
  code: string;
  type: string;
  value: string;
  minPurchase: string;
  maxDiscount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
}

interface CouponResponse {
  coupons?: Coupon[];
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    type: "FIXED",
    value: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
  });

  const fetchCoupons = async (): Promise<void> => {
    try {
      const res = await fetch("/api/coupons");
      const data: CouponResponse = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const res = await fetch("/api/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingCoupon && { id: editingCoupon.id }),
          code: formData.code,
          type: formData.type,
          value: parseInt(formData.value),
          minPurchase: formData.minPurchase ? parseInt(formData.minPurchase) : null,
          maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (res.ok) {
        fetchCoupons();
        setShowModal(false);
        setEditingCoupon(null);
        setFormData({
          code: "",
          type: "FIXED",
          value: "",
          minPurchase: "",
          maxDiscount: "",
          usageLimit: "",
          startDate: "",
          endDate: "",
        });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "خطا در ذخیره کد تخفیف");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert("خطا در حذف کد تخفیف");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleEdit = (coupon: Coupon): void => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minPurchase: coupon.minPurchase?.toString() || "",
      maxDiscount: coupon.maxDiscount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      startDate: coupon.startDate?.split("T")[0] || "",
      endDate: coupon.endDate?.split("T")[0] || "",
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">فعال</span>;
      case "EXPIRED":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">منقضی</span>;
      case "DISABLED":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">غیرفعال</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">کدهای تخفیف</h1>
            <p className="text-zinc-400 mt-1">مدیریت کدهای تخفیف فروشگاه</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/coupons/reports"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              📊 گزارش کدهای تخفیف
            </Link>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setFormData({
                  code: "",
                  type: "FIXED",
                  value: "",
                  minPurchase: "",
                  maxDiscount: "",
                  usageLimit: "",
                  startDate: "",
                  endDate: "",
                });
                setShowModal(true);
              }}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              + کد تخفیف جدید
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-white/5">
              <tr className="text-right">
                <th className="p-4">کد</th>
                <th className="p-4">نوع</th>
                <th className="p-4">مقدار</th>
                <th className="p-4">حداقل خرید</th>
                <th className="p-4">تعداد استفاده</th>
                <th className="p-4">تاریخ انقضا</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: Coupon) => (
                <tr key={coupon.id} className="border-t border-white/10">
                  <td className="p-4 font-mono">{coupon.code}</td>
                  <td className="p-4">
                    {coupon.type === "FIXED" ? "مبلغ ثابت" : "درصدی"}
                  </td>
                  <td className="p-4">
                    {coupon.type === "FIXED" 
                      ? `${coupon.value.toLocaleString()} تومان`
                      : `${coupon.value}%`}
                  </td>
                  <td className="p-4">
                    {coupon.minPurchase ? `${coupon.minPurchase.toLocaleString()} تومان` : "ندارد"}
                  </td>
                  <td className="p-4">
                    {coupon.usedCount} / {coupon.usageLimit || "∞"}
                  </td>
                  <td className="p-4">
                    {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString("fa-IR") : "ندارد"}
                  </td>
                  <td className="p-4">{getStatusBadge(coupon.status)}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {coupons.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              هیچ کد تخفیفی ثبت نشده است
            </div>
          )}
        </div>
      </div>

      {/* Modal افزودن/ویرایش */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              {editingCoupon ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">کد تخفیف *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  required
                  placeholder="مثال: SUMMER1404"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">نوع تخفیف</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  >
                    <option value="FIXED">مبلغ ثابت (تومان)</option>
                    <option value="PERCENTAGE">درصدی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">مقدار تخفیف *</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    required
                    placeholder={formData.type === "FIXED" ? "مبلغ به تومان" : "درصد"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">حداقل مبلغ خرید</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    placeholder="اختیاری"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">حداکثر تخفیف (برای درصدی)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    placeholder="اختیاری"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">تعداد دفعات قابل استفاده</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    placeholder="بدون محدودیت"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">تاریخ شروع</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">تاریخ انقضا</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
                >
                  {editingCoupon ? "بروزرسانی" : "ایجاد کد تخفیف"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}