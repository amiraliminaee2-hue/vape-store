"use client";

import { useEffect, useState } from "react";

interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  basePrice: number;
  pricePerKg: number | null;
  estimatedDays: string | null;
  isActive: boolean;
  provincePrices?: ProvincePrice[];
}

interface ProvincePrice {
  id: number;
  province: string;
  price: number;
}

interface FormData {
  name: string;
  code: string;
  basePrice: string;
  pricePerKg: string;
  estimatedDays: string;
}

const provinces: string[] = [
  "تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی", "خوزستان", "مازندران",
  "گیلان", "کرمان", "آذربایجان شرقی", "آذربایجان غربی", "قم", "سمنان", "یزد",
  "همدان", "مرکزی", "لرستان", "کردستان", "کرمانشاه", "ایلام", "بوشهر", "هرمزگان",
  "چهارمحال و بختیاری", "کهگیلویه و بویراحمد", "زنجان", "اردبیل", "گلستان",
  "خراسان شمالی", "خراسان جنوبی", "سیستان و بلوچستان"
];

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState<FormData>({ 
    name: "", 
    code: "", 
    basePrice: "", 
    pricePerKg: "", 
    estimatedDays: "" 
  });
  const [expandedMethod, setExpandedMethod] = useState<number | null>(null);

  // دریافت روش‌های ارسال
  const fetchMethods = async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/shipping-methods");
      const data: ShippingMethod[] = await res.json();
      setMethods(data);
    } catch (error) {
      console.error("Error fetching methods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // ذخیره روش ارسال جدید/ویرایش
  const handleSave = async (): Promise<void> => {
    try {
      const payload = {
        ...(editingMethod && { id: editingMethod.id }),
        name: formData.name,
        code: formData.code,
        basePrice: parseInt(formData.basePrice),
        pricePerKg: formData.pricePerKg ? parseInt(formData.pricePerKg) : null,
        estimatedDays: formData.estimatedDays || null,
      };

      const url = "/api/admin/shipping-methods";
      const method = editingMethod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeModal();
        fetchMethods();
      } else {
        alert("خطا در ذخیره");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  // تغییر وضعیت فعال/غیرفعال
  const toggleActive = async (id: number, isActive: boolean): Promise<void> => {
    try {
      const method = methods.find((m: ShippingMethod) => m.id === id);
      if (!method) return;

      const res = await fetch("/api/admin/shipping-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...method, isActive: !isActive }),
      });

      if (res.ok) {
        fetchMethods();
      }
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  // حذف روش ارسال
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("آیا از حذف این روش ارسال مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/admin/shipping-methods?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMethods();
      } else {
        alert("خطا در حذف");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // تنظیم قیمت استان
  const handleProvincePrice = async (methodId: number, province: string, price: number): Promise<void> => {
    try {
      const res = await fetch("/api/admin/shipping-methods/province-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ province, shippingMethodId: methodId, price }),
      });
      if (res.ok) {
        fetchMethods();
      }
    } catch (error) {
      console.error("Error setting province price:", error);
    }
  };

  const openModal = (method?: ShippingMethod): void => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        basePrice: method.basePrice.toString(),
        pricePerKg: method.pricePerKg?.toString() || "",
        estimatedDays: method.estimatedDays || "",
      });
    } else {
      setEditingMethod(null);
      setFormData({ name: "", code: "", basePrice: "", pricePerKg: "", estimatedDays: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setFormData({ name: "", code: "", basePrice: "", pricePerKg: "", estimatedDays: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">روش‌های ارسال</h1>
          <p className="mt-2 text-zinc-500">مدیریت روش‌های ارسال و قیمت‌های استانی</p>
        </div>
        <button onClick={() => openModal()} className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 transition">
          + روش ارسال جدید
        </button>
      </div>

      <div className="space-y-4">
        {methods.map((method: ShippingMethod) => (
          <div key={method.id} className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
            <div className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-white/5 transition">
              <div className="col-span-2">
                <p className="font-medium">{method.name}</p>
                <p className="text-xs text-zinc-500">کد: {method.code}</p>
              </div>
              <div>
                <p className="font-semibold">{method.basePrice.toLocaleString("fa-IR")} تومان</p>
                {method.pricePerKg && (
                  <p className="text-xs text-zinc-500">+{method.pricePerKg.toLocaleString("fa-IR")}/کیلو</p>
                )}
              </div>
              <div className="text-zinc-400">{method.estimatedDays || "—"}</div>
              <div>
                <button
                  onClick={() => toggleActive(method.id, method.isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    method.isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {method.isActive ? "فعال" : "غیرفعال"}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => openModal(method)} className="text-violet-400 hover:text-violet-300">✏️</button>
                <button onClick={() => handleDelete(method.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                <button onClick={() => setExpandedMethod(expandedMethod === method.id ? null : method.id)} className="text-zinc-400 hover:text-white">
                  {expandedMethod === method.id ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {/* قیمت‌های استانی */}
            {expandedMethod === method.id && (
              <div className="border-t border-white/10 p-6 bg-black/20">
                <h3 className="font-semibold mb-4">قیمت ویژه استان‌ها</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {provinces.map((province: string) => {
                    const provincePrice = method.provincePrices?.find((p: ProvincePrice) => p.province === province);
                    return (
                      <div key={province} className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400 w-24">{province}</span>
                        <input
                          type="number"
                          defaultValue={provincePrice?.price || method.basePrice}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleProvincePrice(method.id, province, parseInt(e.target.value))}
                          className="w-28 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-sm"
                        />
                        <span className="text-xs">تومان</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* مودال افزودن/ویرایش */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">{editingMethod ? "ویرایش روش ارسال" : "روش ارسال جدید"}</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="نام روش" 
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none" 
              />
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, code: e.target.value }))} 
                placeholder="کد (انگلیسی)" 
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none" 
              />
              <input 
                type="number" 
                value={formData.basePrice} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))} 
                placeholder="قیمت پایه (تومان)" 
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none" 
              />
              <input 
                type="number" 
                value={formData.pricePerKg} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, pricePerKg: e.target.value }))} 
                placeholder="هزینه هر کیلو (اختیاری)" 
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none" 
              />
              <input 
                type="text" 
                value={formData.estimatedDays} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, estimatedDays: e.target.value }))} 
                placeholder="زمان تحویل (مثال: ۲-۳ روز)" 
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none" 
              />
              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition">ذخیره</button>
                <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}