"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageUploaderDirect from "@/components/admin/ImageUploaderDirect";

interface Spec {
  key: string;
  value: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    isActive: true,
    isFeatured: false,
    images: [] as string[],
  });

  const [specs, setSpecs] = useState<Spec[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch("/api/categories"),
        ]);

        const product = await productRes.json();
        const categoriesData = await categoriesRes.json();

        setCategories(categoriesData.categories || []);

        setForm({
          title: product.title || "",
          slug: product.slug || "",
          description: product.description || "",
          price: String(product.price || ""),
          stock: String(product.stock || ""),
          categoryId: String(product.categoryId || ""),
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured ?? false,
          images: product.images || [],
        });

        setSpecs(
          product.specs?.length
            ? product.specs.map((s: { key: string; value: string }) => ({
                key: s.key,
                value: s.value,
              }))
            : [{ key: "", value: "" }]
        );
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSlugGenerate = () => {
    const slug = form.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm((prev) => ({ ...prev, slug }));
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setSpecs((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addSpec = () => {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImagesUploaded = (urls: string[]) => {
    setForm((prev) => ({ ...prev, images: urls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          images: form.images,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          categoryId: Number(form.categoryId),
          specs: specs.filter((s) => s.key && s.value),
        }),
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در ویرایش محصول");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("خطا در ویرایش محصول");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-zinc-500">در حال بارگذاری...</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">ویرایش محصول</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Images Upload */}
          <div
            className="
              p-8
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
              space-y-6
            "
          >
            <h2 className="text-xl font-semibold">تصاویر محصول</h2>
            <ImageUploaderDirect
              onUploaded={handleImagesUploaded}
              existingImages={form.images}
            />
          </div>

          {/* Basic Info */}
          <div
            className="
              p-8
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
              space-y-6
            "
          >
            <h2 className="text-xl font-semibold">اطلاعات پایه</h2>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                نام محصول
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
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
              />
            </div>

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
                />
                <button
                  type="button"
                  onClick={handleSlugGenerate}
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
                  ساخت خودکار
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                توضیحات
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
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
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div
            className="
              p-8
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
              space-y-6
            "
          >
            <h2 className="text-xl font-semibold">قیمت و موجودی</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  قیمت (تومان)
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
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
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  موجودی انبار
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                دسته‌بندی
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
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
                  انتخاب دسته‌بندی
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="bg-zinc-900"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`
                    w-12 h-6
                    rounded-full
                    transition-colors duration-200
                    ${form.isActive ? "bg-violet-600" : "bg-zinc-700"}
                    relative
                  `}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: !prev.isActive,
                    }))
                  }
                >
                  <div
                    className={`
                      absolute top-1
                      w-4 h-4
                      rounded-full
                      bg-white
                      transition-transform duration-200
                      ${form.isActive ? "translate-x-7" : "translate-x-1"}
                    `}
                  />
                </div>
                <span className="text-sm text-zinc-300">فعال</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`
                    w-12 h-6
                    rounded-full
                    transition-colors duration-200
                    ${form.isFeatured ? "bg-violet-600" : "bg-zinc-700"}
                    relative
                  `}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isFeatured: !prev.isFeatured,
                    }))
                  }
                >
                  <div
                    className={`
                      absolute top-1
                      w-4 h-4
                      rounded-full
                      bg-white
                      transition-transform duration-200
                      ${form.isFeatured ? "translate-x-7" : "translate-x-1"}
                    `}
                  />
                </div>
                <span className="text-sm text-zinc-300">پرفروش</span>
              </label>
            </div>
          </div>

          {/* Specs */}
          <div
            className="
              p-8
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
              space-y-6
            "
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">مشخصات فنی</h2>
              <button
                type="button"
                onClick={addSpec}
                className="
                  px-4 py-2
                  rounded-full
                  border border-white/10
                  text-sm
                  text-zinc-400
                  hover:border-violet-500/50
                  hover:text-violet-300
                  transition-all
                "
              >
                + افزودن
              </button>
            </div>

            <div className="space-y-4">
              {specs.map((spec, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) =>
                      handleSpecChange(index, "key", e.target.value)
                    }
                    placeholder="مثلاً: باتری"
                    className="
                      flex-1 px-5 py-3
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
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) =>
                      handleSpecChange(index, "value", e.target.value)
                    }
                    placeholder="مثلاً: 850mAh"
                    className="
                      flex-1 px-5 py-3
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
                    onClick={() => removeSpec(index)}
                    className="
                      w-10 h-10
                      rounded-full
                      border border-red-500/20
                      text-red-400
                      flex items-center justify-center
                      hover:bg-red-500/10
                      transition-all
                      flex-shrink-0
                    "
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
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
            {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>

        </form>
      </div>
    </div>
  );
}