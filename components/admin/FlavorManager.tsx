// components/admin/FlavorManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface Flavor {
  id: number;
  productId: number;
  name: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FlavorManagerProps {
  productId: number;
}

interface FlavorFormData {
  name: string;
  stock: number;
  isActive: boolean;
}

export default function FlavorManager({
  productId,
}: FlavorManagerProps) {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FlavorFormData>({
    name: "",
    stock: 0,
    isActive: true,
  });

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // =========================================================
  // دریافت طعم‌های محصول
  // =========================================================

  const fetchFlavors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/flavors`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        setError(
          errorData?.error ||
            "خطا در دریافت طعم‌های محصول"
        );

        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setFlavors(data);
      } else if (Array.isArray(data.flavors)) {
        setFlavors(data.flavors);
      } else {
        setFlavors([]);
      }
    } catch (error) {
      console.error("Fetch flavors error:", error);
      setError("خطا در دریافت طعم‌های محصول");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  // =========================================================
  // تغییر فیلدهای فرم
  // =========================================================

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ): void => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "stock"
          ? Math.max(0, parseInt(value, 10) || 0)
          : value,
    }));
  };

  // =========================================================
  // ریست فرم
  // =========================================================

  const resetForm = (): void => {
    setFormData({
      name: "",
      stock: 0,
      isActive: true,
    });

    setEditingId(null);
    setError("");
  };

  // =========================================================
  // افزودن طعم
  // =========================================================

  const handleAdd = async (): Promise<void> => {
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError("نام طعم الزامی است");
      return;
    }

    if (formData.stock < 0) {
      setError("موجودی نمی‌تواند منفی باشد");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/flavors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            stock: formData.stock,
            isActive: formData.isActive,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.error ||
            "خطا در افزودن طعم"
        );
        return;
      }

      const newFlavor: Flavor = data;

      setFlavors((prev) => [...prev, newFlavor]);

      setSuccess("طعم با موفقیت اضافه شد");

      setFormData({
        name: "",
        stock: 0,
        isActive: true,
      });

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Add flavor error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setAdding(false);
    }
  };

  // =========================================================
  // شروع ویرایش
  // =========================================================

  const handleEdit = (flavor: Flavor): void => {
    setEditingId(flavor.id);

    setFormData({
      name: flavor.name,
      stock: flavor.stock,
      isActive: flavor.isActive,
    });

    setError("");
    setSuccess("");
  };

  // =========================================================
  // بروزرسانی طعم
  // =========================================================

  const handleUpdate = async (): Promise<void> => {
    if (!editingId) {
      setError("طعم برای ویرایش انتخاب نشده است");
      return;
    }

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError("نام طعم الزامی است");
      return;
    }

    if (formData.stock < 0) {
      setError("موجودی نمی‌تواند منفی باشد");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/flavors`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            flavorId: editingId,
            name: trimmedName,
            stock: formData.stock,
            isActive: formData.isActive,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.error ||
            "خطا در بروزرسانی طعم"
        );
        return;
      }

      const updatedFlavor: Flavor = data;

      setFlavors((prev) =>
        prev.map((flavor) =>
          flavor.id === editingId
            ? updatedFlavor
            : flavor
        )
      );

      setSuccess("طعم با موفقیت بروزرسانی شد");

      resetForm();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Update flavor error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setAdding(false);
    }
  };

  // =========================================================
  // حذف طعم
  // =========================================================

  const handleDelete = async (
    flavorId: number
  ): Promise<void> => {
    const flavor = flavors.find(
      (item) => item.id === flavorId
    );

    if (!flavor) {
      setError("طعم موردنظر پیدا نشد");
      return;
    }

    if (
      !confirm(
        `آیا از حذف طعم «${flavor.name}» مطمئن هستید؟`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/flavors?flavorId=${flavorId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.error ||
            "خطا در حذف طعم"
        );
        return;
      }

      setFlavors((prev) =>
        prev.filter(
          (item) => item.id !== flavorId
        )
      );

      if (editingId === flavorId) {
        resetForm();
      }

      setSuccess("طعم با موفقیت حذف شد");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Delete flavor error:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  // =========================================================
  // مجموع موجودی تمام طعم‌ها
  // =========================================================

  const totalFlavorStock = flavors.reduce(
    (total, flavor) =>
      total + Math.max(0, flavor.stock),
    0
  );

  // =========================================================
  // وضعیت Loading
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-bold">
            طعم‌های محصول
          </h3>

          <p className="text-sm text-zinc-500 mt-1">
            هر طعم موجودی مستقل دارد و قیمت تمام طعم‌ها
            برابر با قیمت اصلی محصول است.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <span className="text-sm text-zinc-500">
            {flavors.length} طعم
          </span>

          {flavors.length > 0 && (
            <span className="text-sm text-violet-400">
              مجموع موجودی: {totalFlavorStock}
            </span>
          )}

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-5">

        <div>
          <h4 className="text-lg font-semibold">
            {editingId
              ? "ویرایش طعم"
              : "افزودن طعم جدید"}
          </h4>

          <p className="text-xs text-zinc-500 mt-1">
            قیمت از محصول اصلی گرفته می‌شود و برای طعم
            قیمت جداگانه ثبت نمی‌شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              نام طعم *
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="مثلاً: توت فرنگی"
              disabled={adding}
              className="
                w-full
                px-4
                py-3
                rounded-xl
                bg-zinc-900
                border
                border-white/10
                focus:border-violet-500
                outline-none
                transition-colors
                text-sm
                disabled:opacity-50
              "
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              موجودی این طعم *
            </label>

            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              step="1"
              disabled={adding}
              className="
                w-full
                px-4
                py-3
                rounded-xl
                bg-zinc-900
                border
                border-white/10
                focus:border-violet-500
                outline-none
                transition-colors
                text-sm
                disabled:opacity-50
              "
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              وضعیت
            </label>

            <select
              name="isActive"
              value={
                formData.isActive
                  ? "true"
                  : "false"
              }
              onChange={handleInputChange}
              disabled={adding}
              className="
                w-full
                px-4
                py-3
                rounded-xl
                bg-zinc-900
                border
                border-white/10
                focus:border-violet-500
                outline-none
                transition-colors
                text-sm
                disabled:opacity-50
              "
            >
              <option value="true">
                فعال
              </option>

              <option value="false">
                غیرفعال
              </option>
            </select>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={
              editingId
                ? handleUpdate
                : handleAdd
            }
            disabled={adding}
            className="
              px-6
              py-3
              rounded-xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
              disabled:opacity-50
              disabled:cursor-not-allowed
              text-sm
              font-medium
            "
          >
            {adding
              ? "در حال ذخیره..."
              : editingId
              ? "بروزرسانی طعم"
              : "افزودن طعم"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={adding}
              className="
                px-6
                py-3
                rounded-xl
                bg-white/10
                hover:bg-white/20
                transition-colors
                disabled:opacity-50
                text-sm
              "
            >
              انصراف
            </button>
          )}

        </div>
      </div>

      {/* Flavor List */}
      {flavors.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center">

          <div className="text-zinc-500 mb-2">
            هیچ طعمی برای این محصول ثبت نشده است.
          </div>

          <div className="text-xs text-zinc-600">
            از فرم بالا اولین طعم محصول را اضافه کنید.
          </div>

        </div>
      ) : (
        <div className="space-y-3">

          {flavors.map((flavor) => (

            <div
              key={flavor.id}
              className="
                flex
                items-center
                justify-between
                gap-4
                p-4
                rounded-xl
                bg-white/5
                border
                border-white/10
                hover:border-violet-500/30
                transition-all
                flex-wrap
              "
            >

              {/* Information */}
              <div className="flex items-center gap-4 flex-wrap">

                <span className="font-medium">
                  {flavor.name}
                </span>

                <span
                  className={`
                    text-sm
                    ${
                      flavor.stock > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  `}
                >
                  موجودی:{" "}
                  {flavor.stock.toLocaleString(
                    "fa-IR"
                  )}
                </span>

                <span
                  className="
                    text-xs
                    px-2
                    py-1
                    rounded-full
                    bg-zinc-800
                    text-zinc-400
                  "
                >
                  قیمت محصول
                </span>

                <span
                  className={`
                    text-xs
                    px-2
                    py-1
                    rounded-full
                    ${
                      flavor.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  `}
                >
                  {flavor.isActive
                    ? "فعال"
                    : "غیرفعال"}
                </span>

              </div>

              {/* Actions */}
              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    handleEdit(flavor)
                  }
                  className="
                    px-3
                    py-2
                    rounded-lg
                    bg-white/10
                    hover:bg-white/20
                    transition-colors
                    text-sm
                  "
                  title="ویرایش"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(flavor.id)
                  }
                  className="
                    px-3
                    py-2
                    rounded-lg
                    bg-red-500/20
                    hover:bg-red-500/30
                    transition-colors
                    text-sm
                    text-red-400
                  "
                  title="حذف"
                >
                  🗑️
                </button>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* Stock explanation */}
      {flavors.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">

          <p className="text-sm text-violet-300">
            نکته موجودی:
          </p>

          <p className="text-xs text-zinc-500 mt-2 leading-6">
            موجودی هر طعم مستقل از طعم‌های دیگر کنترل
            می‌شود. برای مثال اگر موجودی «توت فرنگی»
            برابر ۳ باشد، کاربر نمی‌تواند بیشتر از ۳ عدد
            از این طعم به سبد خرید اضافه کند؛ حتی اگر
            موجودی سایر طعم‌ها بیشتر باشد.
          </p>

        </div>
      )}

    </div>
  );
}