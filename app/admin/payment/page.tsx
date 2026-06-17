"use client";

import { useEffect, useState } from "react";

interface PaymentMethodSettings {
  cardNumber?: string;
  bankName?: string;
  accountName?: string;
  message?: string;
  gateway?: string;
  telegram?: string;
  rubika?: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  settings: PaymentMethodSettings;
}

interface FormData {
  name: string;
  code: string;
  cardNumber: string;
  bankName: string;
  accountName: string;
  message: string;
  telegram: string;
  rubika: string;
  gateway: string;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    cardNumber: "",
    bankName: "",
    accountName: "",
    message: "",
    telegram: "",
    rubika: "",
    gateway: "zarinpal",
  });

  // دریافت روش‌های پرداخت از API
  const fetchMethods = async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/payment-methods");
      const data: PaymentMethod[] = await res.json();
      setMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // ذخیره روش پرداخت
  const handleSave = async (): Promise<void> => {
    try {
      const settings: PaymentMethodSettings = {};
      
      if (formData.code === "online") {
        settings.gateway = formData.gateway;
      } else if (formData.code === "cart2cart") {
        settings.cardNumber = formData.cardNumber;
        settings.bankName = formData.bankName;
        settings.accountName = formData.accountName;
        settings.message = formData.message;
        settings.telegram = formData.telegram;
        settings.rubika = formData.rubika;
      }

      const payload: Partial<PaymentMethod> & { settings: PaymentMethodSettings } = {
        name: formData.name,
        code: formData.code,
        isActive: true,
        settings,
      };

      if (editingMethod) {
        payload.id = editingMethod.id;
      }

      const url = "/api/admin/payment-methods";
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
      const method = methods.find((m: PaymentMethod) => m.id === id);
      if (!method) return;

      const res = await fetch("/api/admin/payment-methods", {
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

  // حذف روش پرداخت
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("آیا از حذف این روش پرداخت مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/admin/payment-methods?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMethods();
      } else {
        alert("خطا در حذف");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const openModal = (method?: PaymentMethod): void => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        cardNumber: method.settings?.cardNumber || "",
        bankName: method.settings?.bankName || "",
        accountName: method.settings?.accountName || "",
        message: method.settings?.message || "",
        telegram: method.settings?.telegram || "",
        rubika: method.settings?.rubika || "",
        gateway: method.settings?.gateway || "zarinpal",
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: "",
        code: "online",
        cardNumber: "",
        bankName: "",
        accountName: "",
        message: "",
        telegram: "",
        rubika: "",
        gateway: "zarinpal",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingMethod(null);
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
          <h1 className="text-4xl font-bold">روش‌های پرداخت</h1>
          <p className="mt-2 text-zinc-500">مدیریت درگاه‌های پرداخت و روش‌های تسویه</p>
        </div>
        <button onClick={() => openModal()} className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 transition">
          + روش پرداخت جدید
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-white/5 text-zinc-400 text-sm font-medium">
          <span>نام روش</span>
          <span>کد</span>
          <span>تنظیمات</span>
          <span>وضعیت</span>
          <span>عملیات</span>
        </div>

        <div className="divide-y divide-white/5">
          {methods.map((method: PaymentMethod) => (
            <div key={method.id} className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-white/5 transition">
              <span className="font-medium">{method.name}</span>
              <span className="text-zinc-400 text-sm">{method.code}</span>
              <div className="text-sm text-zinc-500">
                {method.code === "online" && (
                  <span>درگاه: {method.settings?.gateway === "zarinpal" ? "زرین‌پال" : method.settings?.gateway}</span>
                )}
                {method.code === "cart2cart" && (
                  <div className="text-xs">
                    <div>شماره کارت: {method.settings?.cardNumber || "—"}</div>
                    <div className="text-zinc-600 mt-1">{method.settings?.message?.slice(0, 30)}...</div>
                  </div>
                )}
                {method.code !== "online" && method.code !== "cart2cart" && (
                  <span className="text-zinc-600">—</span>
                )}
              </div>
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
              <div className="flex gap-2">
                <button onClick={() => openModal(method)} className="text-violet-400 hover:text-violet-300">✏️</button>
                <button onClick={() => handleDelete(method.id)} className="text-red-400 hover:text-red-300">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* مودال افزودن/ویرایش */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">{editingMethod ? "ویرایش روش پرداخت" : "روش پرداخت جدید"}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام روش (مثال: پرداخت آنلاین)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
              />
              <select
                value={formData.code}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
              >
                <option value="online">پرداخت آنلاین (درگاه بانکی)</option>
                <option value="cart2cart">کارت به کارت</option>
                <option value="cash">پرداخت نقدی (در محل)</option>
              </select>

              {/* تنظیمات بر اساس نوع روش */}
              {formData.code === "online" && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">درگاه پرداخت</label>
                  <select
                    value={formData.gateway}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, gateway: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  >
                    <option value="zarinpal">زرین‌پال</option>
                    <option value="paypal">پی‌پال (فعال نشده)</option>
                  </select>
                </div>
              )}

              {formData.code === "cart2cart" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="شماره کارت (مثال: 6037-****-****-****)"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="نام بانک"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="نام صاحب حساب"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="لینک تلگرام پشتیبانی"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                    <input
                      type="text"
                      value={formData.rubika}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, rubika: e.target.value }))}
                      placeholder="لینک روبیکا پشتیبانی"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="پیام راهنمای کاربر (مثال: لطفاً پس از واریز، رسید را در تلگرام ارسال کنید)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none resize-none"
                  />
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition">
                  ذخیره
                </button>
                <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">
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