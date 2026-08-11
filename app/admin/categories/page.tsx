"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image?: string | null;
  _count: {
    products: number;
  };
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت دسته‌بندی‌ها");
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "خطا در دریافت دسته‌بندی‌ها"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSlugGenerate = (): void => {
    const slug = form.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setForm((prev) => ({
      ...prev,
      slug,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("نام دسته‌بندی را وارد کنید");
      return;
    }

    if (!form.slug.trim()) {
      alert("Slug دسته‌بندی را وارد کنید");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          image: form.image.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationMessage =
          data?.details?.[0]?.message || data?.error;

        throw new Error(
          validationMessage || "خطا در ایجاد دسته‌بندی"
        );
      }

      setCategories((prev) => [
        ...prev,
        {
          ...data,
          _count: {
            products: 0,
          },
        },
      ]);

      setForm({
        name: "",
        slug: "",
        description: "",
        image: "",
      });

      setShowForm(false);

      alert("دسته‌بندی با موفقیت ایجاد شد");
    } catch (error) {
      console.error("Create category error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "خطا در ایجاد دسته‌بندی"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (): void => {
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });

    setShowForm(false);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            دسته بندی ها
          </h1>

          <p className="text-zinc-500 mt-2">
            مدیریت دسته‌بندی‌های محصولات
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="
            px-6
            py-3
            rounded-2xl
            bg-violet-600
            hover:bg-violet-500
            transition-colors
            font-semibold
          "
        >
          {showForm ? "بستن فرم" : "+ افزودن دسته‌بندی"}
        </button>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div
          className="
            mb-8
            rounded-3xl
            border border-white/10
            p-8
            bg-white/[0.03]
          "
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              افزودن دسته‌بندی جدید
            </h2>

            <button
              type="button"
              onClick={handleCancel}
              className="
                w-10
                h-10
                rounded-full
                border border-white/10
                text-zinc-400
                hover:text-white
                hover:border-white/30
                transition-colors
              "
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Name */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                نام دسته‌بندی
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                placeholder="مثلاً: ویپ"
                className="
                  w-full
                  px-5
                  py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  placeholder:text-zinc-600
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                "
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Slug
              </label>

              <div className="flex gap-3">
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="vape"
                  dir="ltr"
                  className="
                    flex-1
                    px-5
                    py-3
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    text-white
                    placeholder:text-zinc-600
                    outline-none
                    focus:border-violet-500/50
                    transition-colors
                  "
                />

                <button
                  type="button"
                  onClick={handleSlugGenerate}
                  className="
                    px-5
                    py-3
                    rounded-2xl
                    border border-white/10
                    text-zinc-400
                    hover:border-violet-500/50
                    hover:text-violet-300
                    transition-all
                    whitespace-nowrap
                  "
                >
                  ساخت خودکار
                </button>
              </div>

              <p className="text-xs text-zinc-600 mt-2">
                فقط حروف انگلیسی کوچک، اعداد و خط تیره مجاز است.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                توضیحات
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="توضیحات دسته‌بندی..."
                className="
                  w-full
                  px-5
                  py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  placeholder:text-zinc-600
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                  resize-none
                "
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                آدرس تصویر
              </label>

              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
                className="
                  w-full
                  px-5
                  py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-white
                  placeholder:text-zinc-600
                  outline-none
                  focus:border-violet-500/50
                  transition-colors
                "
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-violet-600
                  hover:bg-violet-500
                  transition-colors
                  font-semibold
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {saving
                  ? "در حال ذخیره..."
                  : "ذخیره دسته‌بندی"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="
                  px-8
                  py-4
                  rounded-2xl
                  border border-white/10
                  text-zinc-400
                  hover:text-white
                  hover:border-white/30
                  transition-colors
                  disabled:opacity-50
                "
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories */}
      {loading ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            p-10
            bg-white/[0.03]
            text-center
            text-zinc-400
          "
        >
          در حال دریافت دسته‌بندی‌ها...
        </div>
      ) : categories.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            p-10
            bg-white/[0.03]
            text-center
          "
        >
          <p className="text-zinc-400 mb-4">
            هنوز هیچ دسته‌بندی‌ای ایجاد نشده است.
          </p>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="
              px-6
              py-3
              rounded-2xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
              font-semibold
            "
          >
            + ایجاد اولین دسته‌بندی
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <div
              key={category.id}
              className="
                rounded-3xl
                border border-white/10
                p-6
                bg-white/[0.03]
                hover:border-white/20
                transition-colors
              "
            >
              <h2 className="text-xl font-semibold">
                {category.name}
              </h2>

              <p className="text-zinc-500 mt-2">
                {category.description || "بدون توضیحات"}
              </p>

              <div className="mt-3 text-xs text-zinc-600">
                slug: {category.slug}
              </div>

              <div className="mt-5 text-violet-400">
                {category._count.products} محصول
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}