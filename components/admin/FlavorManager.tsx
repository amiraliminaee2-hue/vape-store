// components/admin/FlavorManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface Flavor {
  id: number;
  productId: number;
  name: string;
  stock: number;
  price: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FlavorManagerProps {
  productId: number;
}

export default function FlavorManager({ productId }: FlavorManagerProps) {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    stock: 0,
    price: "",
    isActive: true,
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const fetchFlavors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${productId}/flavors`);
      if (res.ok) {
        const data = await res.json();
        setFlavors(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "خطا در دریافت طعم‌ها");
      }
    } catch (error) {
      console.error("Fetch flavors error:", error);
      setError("خطا در دریافت طعم‌ها");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked 
        : name === "stock" 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      stock: 0,
      price: "",
      isActive: true,
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("نام طعم الزامی است");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/products/${productId}/flavors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          stock: formData.stock,
          price: formData.price ? parseInt(formData.price) : undefined,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        const newFlavor = await res.json();
        setFlavors((prev) => [...prev, newFlavor]);
        setSuccess("طعم با موفقیت اضافه شد");
        resetForm();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "خطا در افزودن طعم");
      }
    } catch (error) {
      console.error("Add flavor error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (flavor: Flavor) => {
    setEditingId(flavor.id);
    setFormData({
      name: flavor.name,
      stock: flavor.stock,
      price: flavor.price?.toString() || "",
      isActive: flavor.isActive,
    });
    setError("");
    setSuccess("");
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      setError("نام طعم الزامی است");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/products/${productId}/flavors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flavorId: editingId,
          name: formData.name.trim(),
          stock: formData.stock,
          price: formData.price ? parseInt(formData.price) : null,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        const updatedFlavor = await res.json();
        setFlavors((prev) =>
          prev.map((f) => (f.id === editingId ? updatedFlavor : f))
        );
        setSuccess("طعم با موفقیت بروزرسانی شد");
        resetForm();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "خطا در بروزرسانی طعم");
      }
    } catch (error) {
      console.error("Update flavor error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (flavorId: number) => {
    if (!confirm("آیا از حذف این طعم مطمئن هستید؟")) return;

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/flavors?flavorId=${flavorId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setFlavors((prev) => prev.filter((f) => f.id !== flavorId));
        setSuccess("طعم با موفقیت حذف شد");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "خطا در حذف طعم");
      }
    } catch (error) {
      console.error("Delete flavor error:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">طعم‌های محصول</h3>
        <span className="text-sm text-zinc-500">{flavors.length} طعم</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">نام طعم *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="مثلاً: توت فرنگی"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">موجودی</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">قیمت اضافی (تومان)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              placeholder="اختیاری"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-1">وضعیت</label>
              <select
                name="isActive"
                value={formData.isActive ? "true" : "false"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition-colors text-sm"
              >
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
            </div>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={adding}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
            >
              {adding ? "..." : editingId ? "بروزرسانی" : "افزودن"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                انصراف
              </button>
            )}
          </div>
        </div>
      </div>

      {flavors.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-zinc-500">
          هیچ طعمی برای این محصول ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-2">
          {flavors.map((flavor) => (
            <div
              key={flavor.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-medium">{flavor.name}</span>
                <span className={`text-sm ${flavor.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                  موجودی: {flavor.stock}
                </span>
                {flavor.price && (
                  <span className="text-sm text-zinc-400">
                    +{flavor.price.toLocaleString("fa-IR")} تومان
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  flavor.isActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {flavor.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(flavor)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(flavor.id)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-sm text-red-400"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}