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
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] =
    useState<PaymentMethod | null>(null);

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
      setLoading(true);

      const res = await fetch("/api/admin/payment-methods", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error fetching payment methods:", data);
        alert(data?.error || "خطا در دریافت روش‌های پرداخت");
        return;
      }

      if (Array.isArray(data)) {
        setMethods(data);
      } else {
        console.error("Invalid payment methods response:", data);
        setMethods([]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // ساخت تنظیمات روش پرداخت
  const buildSettings = (): PaymentMethodSettings => {
    const settings: PaymentMethodSettings = {};

    if (formData.code === "online") {
      settings.gateway = formData.gateway;
    }

    if (formData.code === "cart2cart") {
      settings.cardNumber = formData.cardNumber;
      settings.bankName = formData.bankName;
      settings.accountName = formData.accountName;
      settings.message = formData.message;
      settings.telegram = formData.telegram;
      settings.rubika = formData.rubika;
    }

    return settings;
  };

  // ذخیره روش پرداخت
  const handleSave = async (): Promise<void> => {
    if (!formData.name.trim()) {
      alert("لطفاً نام روش پرداخت را وارد کنید");
      return;
    }

    if (!formData.code.trim()) {
      alert("لطفاً کد روش پرداخت را انتخاب کنید");
      return;
    }

    try {
      setSaving(true);

      const settings = buildSettings();

      const payload = editingMethod
        ? {
            action: "update",
            id: editingMethod.id,
            name: formData.name.trim(),
            code: formData.code,
            isActive: editingMethod.isActive,
            settings,
          }
        : {
            action: "create",
            name: formData.name.trim(),
            code: formData.code,
            isActive: true,
            settings,
          };

      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          editingMethod
            ? "روش پرداخت با موفقیت ویرایش شد"
            : "روش پرداخت با موفقیت ایجاد شد"
        );

        closeModal();
        await fetchMethods();
      } else {
        console.error("Payment method save error:", data);

        alert(
          data?.error ||
            (editingMethod
              ? "خطا در ویرایش روش پرداخت"
              : "خطا در ایجاد روش پرداخت")
        );
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  // تغییر وضعیت فعال/غیرفعال
  const toggleActive = async (
    id: number,
    isActive: boolean
  ): Promise<void> => {
    try {
      const method = methods.find(
        (item: PaymentMethod) => item.id === id
      );

      if (!method) {
        return;
      }

      setTogglingId(id);

      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          id: method.id,
          name: method.name,
          code: method.code,
          isActive: !isActive,
          settings: method.settings || {},
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchMethods();
      } else {
        console.error("Toggle payment method error:", data);

        alert(
          data?.error || "خطا در تغییر وضعیت روش پرداخت"
        );
      }
    } catch (error) {
      console.error(
        "Error toggling payment method active state:",
        error
      );

      alert("خطا در ارتباط با سرور");
    } finally {
      setTogglingId(null);
    }
  };

  // حذف روش پرداخت
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("آیا از حذف این روش پرداخت مطمئن هستید؟")) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("روش پرداخت با موفقیت حذف شد");
        await fetchMethods();
      } else {
        console.error("Delete payment method error:", data);

        alert(
          data?.error || "خطا در حذف روش پرداخت"
        );
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setDeletingId(null);
    }
  };

  // باز کردن مودال
  const openModal = (method?: PaymentMethod): void => {
    if (method) {
      setEditingMethod(method);

      setFormData({
        name: method.name,
        code: method.code,
        cardNumber:
          method.settings?.cardNumber || "",
        bankName:
          method.settings?.bankName || "",
        accountName:
          method.settings?.accountName || "",
        message:
          method.settings?.message || "",
        telegram:
          method.settings?.telegram || "",
        rubika:
          method.settings?.rubika || "",
        gateway:
          method.settings?.gateway || "zarinpal",
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

  // بستن مودال
  const closeModal = (): void => {
    setIsModalOpen(false);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">
            روش‌های پرداخت
          </h1>

          <p className="mt-2 text-zinc-500">
            مدیریت درگاه‌های پرداخت و روش‌های تسویه
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 transition"
        >
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
          {methods.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              هنوز روش پرداختی ثبت نشده است.
            </div>
          ) : (
            methods.map((method: PaymentMethod) => (
              <div
                key={method.id}
                className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-white/5 transition"
              >
                <span className="font-medium">
                  {method.name}
                </span>

                <span className="text-zinc-400 text-sm">
                  {method.code}
                </span>

                <div className="text-sm text-zinc-500">
                  {method.code === "online" && (
                    <span>
                      درگاه:{" "}
                      {method.settings?.gateway ===
                      "zarinpal"
                        ? "زرین‌پال"
                        : method.settings?.gateway ||
                          "—"}
                    </span>
                  )}

                  {method.code === "cart2cart" && (
                    <div className="text-xs">
                      <div>
                        شماره کارت:{" "}
                        {method.settings?.cardNumber ||
                          "—"}
                      </div>

                      <div className="text-zinc-600 mt-1">
                        {method.settings?.message
                          ? `${method.settings.message.slice(
                              0,
                              30
                            )}...`
                          : "—"}
                      </div>
                    </div>
                  )}

                  {method.code !== "online" &&
                    method.code !== "cart2cart" && (
                      <span className="text-zinc-600">
                        —
                      </span>
                    )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleActive(
                        method.id,
                        method.isActive
                      )
                    }
                    disabled={
                      togglingId === method.id
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      method.isActive
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    } ${
                      togglingId === method.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {togglingId === method.id
                      ? "..."
                      : method.isActive
                      ? "فعال"
                      : "غیرفعال"}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      openModal(method)
                    }
                    disabled={
                      deletingId === method.id
                    }
                    className="text-violet-400 hover:text-violet-300 transition disabled:opacity-50"
                    title="ویرایش"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(method.id)
                    }
                    disabled={
                      deletingId === method.id
                    }
                    className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                    title="حذف"
                  >
                    {deletingId === method.id
                      ? "..."
                      : "🗑️"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* مودال افزودن / ویرایش */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              {editingMethod
                ? "ویرایش روش پرداخت"
                : "روش پرداخت جدید"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                value={formData.name}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="نام روش (مثال: پرداخت آنلاین)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
              />

              <select
                value={formData.code}
                onChange={(
                  e: React.ChangeEvent<HTMLSelectElement>
                ) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
              >
                <option value="online">
                  پرداخت آنلاین (درگاه بانکی)
                </option>

                <option value="cart2cart">
                  کارت به کارت
                </option>

                <option value="cash">
                  پرداخت نقدی (در محل)
                </option>
              </select>

              {/* تنظیمات پرداخت آنلاین */}
              {formData.code === "online" && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    درگاه پرداخت
                  </label>

                  <select
                    value={formData.gateway}
                    onChange={(
                      e: React.ChangeEvent<HTMLSelectElement>
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        gateway: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  >
                    <option value="zarinpal">
                      زرین‌پال
                    </option>

                    <option value="paypal">
                      پی‌پال (فعال نشده)
                    </option>
                  </select>
                </div>
              )}

              {/* تنظیمات کارت به کارت */}
              {formData.code === "cart2cart" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          cardNumber:
                            e.target.value,
                        }))
                      }
                      placeholder="شماره کارت (مثال: 6037-****-****-****)"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />

                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          bankName:
                            e.target.value,
                        }))
                      }
                      placeholder="نام بانک"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        accountName:
                          e.target.value,
                      }))
                    }
                    placeholder="نام صاحب حساب"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          telegram:
                            e.target.value,
                        }))
                      }
                      placeholder="لینک تلگرام پشتیبانی"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />

                    <input
                      type="text"
                      value={formData.rubika}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          rubika:
                            e.target.value,
                        }))
                      }
                      placeholder="لینک روبیکا پشتیبانی"
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
                    />
                  </div>

                  <textarea
                    value={formData.message}
                    onChange={(
                      e: React.ChangeEvent<HTMLTextAreaElement>
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        message:
                          e.target.value,
                      }))
                    }
                    placeholder="پیام راهنمای کاربر (مثال: لطفاً پس از واریز، رسید را در تلگرام ارسال کنید)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none resize-none"
                  />
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "در حال ذخیره..."
                    : "ذخیره"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
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