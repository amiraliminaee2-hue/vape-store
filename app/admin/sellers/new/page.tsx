"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
}

export default function NewSellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [form, setForm] = useState({
    userId: "",
    storeName: "",
    slug: "",
    description: "",
    phone: "",
    address: "",
    logo: "",
    coverImage: "",
    commission: 10,
    status: "PENDING",
  });

  useEffect(() => {
    // دریافت لیست کاربران برای انتخاب فروشنده
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users?limit=100");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const generateSlug = () => {
    const slug = form.storeName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/sellers");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در ایجاد فروشنده");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("خطا در ایجاد فروشنده");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
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
          <h1 className="text-3xl font-bold">افزودن فروشنده جدید</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Selection */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-6">
            <h2 className="text-xl font-semibold">اطلاعات کاربر</h2>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                کاربر *
              </label>
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
                className="
                  w-full px-5 py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                  cursor-pointer
                "
              >
                <option value="" className="bg-zinc-900">
                  انتخاب کاربر
                </option>
                {loadingUsers ? (
                  <option disabled>در حال بارگذاری...</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id} className="bg-zinc-900">
                      {user.name || user.email} - {user.email}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Store Information */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-6">
            <h2 className="text-xl font-semibold">اطلاعات فروشگاه</h2>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                نام فروشگاه *
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="storeName"
                  value={form.storeName}
                  onChange={handleChange}
                  required
                  className="
                    flex-1 px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                  placeholder="مثلاً: فروشگاه ویپ"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="
                    px-5 py-3
                    rounded-2xl
                    border border-white/10
                    text-zinc-400
                    text-sm
                    hover:border-violet-500/50
                    hover:text-violet-300
                    transition-all
                  "
                >
                  ساخت slug
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Slug (آدرس یکتا) *
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="
                  w-full px-5 py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                "
                placeholder="vape-shop"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                توضیحات فروشگاه
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="
                  w-full px-5 py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                  resize-none
                "
                placeholder="توضیحات درباره فروشگاه..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  شماره تماس
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  آدرس
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                  placeholder="تهران، خیابان ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  کمیسیون (درصد)
                </label>
                <input
                  type="number"
                  name="commission"
                  value={form.commission}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  وضعیت
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                    cursor-pointer
                  "
                >
                  <option value="PENDING">در انتظار تأیید</option>
                  <option value="APPROVED">تأیید شده</option>
                  <option value="REJECTED">رد شده</option>
                  <option value="SUSPENDED">تعلیق شده</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  آدرس لوگو
                </label>
                <input
                  type="text"
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                  placeholder="/uploads/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  آدرس تصویر کاور
                </label>
                <input
                  type="text"
                  name="coverImage"
                  value={form.coverImage}
                  onChange={handleChange}
                  className="
                    w-full px-5 py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                  placeholder="/uploads/cover.jpg"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-4
              rounded-2xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
              font-semibold
              text-lg
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "در حال ذخیره..." : "افزودن فروشنده"}
          </button>
        </form>
      </div>
    </div>
  );
}