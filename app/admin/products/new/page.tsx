"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/admin/ImageUploader";
import FlavorManager from "@/components/admin/FlavorManager";

interface Spec {
  key: string;
  value: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
}

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    isActive: true,
    isFeatured: false,
    images: [],
  });

  const [specs, setSpecs] = useState<Spec[]>([
    { key: "", value: "" },
  ]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: { categories: Category[] }) => {
        setCategories(data.categories || []);
      })
      .catch((error) => {
        console.error("Categories fetch error:", error);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
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

  const handleSlugGenerate = (): void => {
    const slug = form.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    setForm((prev) => ({
      ...prev,
      slug,
    }));
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    value: string
  ): void => {
    setSpecs((prev) => {
      const updated = [...prev];

      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }

      return updated;
    });
  };

  const addSpec = (): void => {
    setSpecs((prev) => [
      ...prev,
      {
        key: "",
        value: "",
      },
    ]);
  };

  const removeSpec = (index: number): void => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImagesUploaded = (urls: string[]): void => {
    setForm((prev) => ({
      ...prev,
      images: urls,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          specs: specs.filter(
            (spec: Spec) => spec.key.trim() && spec.value.trim()
          ),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "خطا در ایجاد محصول");
        return;
      }

      if (!data.id) {
        console.error("Product creation response:", data);

        alert(
          "محصول ایجاد شد اما شناسه محصول از سرور دریافت نشد."
        );

        return;
      }

      setCreatedProductId(Number(data.id));

      alert("محصول با موفقیت ایجاد شد. اکنون می‌توانید طعم‌ها را اضافه کنید.");
    } catch (error) {
      console.error("Submit error:", error);
      alert("خطا در ایجاد محصول");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = (): void => {
    router.push("/admin/products");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            type="button"
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

          <h1 className="text-3xl font-bold">
            محصول جدید
          </h1>
        </div>

        {!createdProductId ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

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
              <h2 className="text-xl font-semibold">
                اطلاعات پایه
              </h2>

              {/* Images Upload */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  تصاویر محصول
                </label>

                <ImageUploader
                  onUploaded={handleImagesUploaded}
                  existingImages={form.images}
                />
              </div>

              {/* Product Name */}
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
                  placeholder="مثلاً: Nebula X Pro"
                  className="
                    w-full px-5 py-3
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
                  Slug (برای URL)
                </label>

                <div className="flex gap-3">
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                    placeholder="nebula-x-pro"
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

              {/* Description */}
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
                  placeholder="توضیح کامل محصول..."
                  className="
                    w-full px-5 py-3
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
              <h2 className="text-xl font-semibold">
                قیمت و موجودی
              </h2>

              <div className="grid grid-cols-2 gap-6">

                {/* Price */}
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
                    min="0"
                    placeholder="3200000"
                    className="
                      w-full px-5 py-3
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

                {/* Stock */}
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
                    min="0"
                    placeholder="10"
                    className="
                      w-full px-5 py-3
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

              </div>

              {/* Category */}
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
                  <option
                    value=""
                    className="bg-zinc-900"
                  >
                    انتخاب دسته‌بندی
                  </option>

                  {categories.map((cat: Category) => (
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

              {/* Status */}
              <div className="flex gap-8">

                {/* Active */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`
                      w-12 h-6
                      rounded-full
                      transition-colors duration-200
                      ${form.isActive
                        ? "bg-violet-600"
                        : "bg-zinc-700"
                      }
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
                        ${form.isActive
                          ? "translate-x-7"
                          : "translate-x-1"
                        }
                      `}
                    />
                  </div>

                  <span className="text-sm text-zinc-300">
                    فعال
                  </span>
                </label>

                {/* Featured */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`
                      w-12 h-6
                      rounded-full
                      transition-colors duration-200
                      ${form.isFeatured
                        ? "bg-violet-600"
                        : "bg-zinc-700"
                      }
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
                        ${form.isFeatured
                          ? "translate-x-7"
                          : "translate-x-1"
                        }
                      `}
                    />
                  </div>

                  <span className="text-sm text-zinc-300">
                    پرفروش
                  </span>
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
                <h2 className="text-xl font-semibold">
                  مشخصات فنی
                </h2>

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
                {specs.map(
                  (spec: Spec, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 items-center"
                    >
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          handleSpecChange(
                            index,
                            "key",
                            e.target.value
                          )
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
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          handleSpecChange(
                            index,
                            "value",
                            e.target.value
                          )
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
                        onClick={() =>
                          removeSpec(index)
                        }
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
                  )
                )}
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
              {loading
                ? "در حال ذخیره..."
                : "ذخیره محصول"}
            </button>

          </form>
        ) : (

          /* =========================================
             Flavor Manager
             ========================================= */
          <div className="space-y-8">

            <div
              className="
                p-8
                rounded-3xl
                border border-green-500/20
                bg-green-500/[0.03]
                space-y-3
              "
            >
              <h2 className="text-2xl font-bold text-green-400">
                محصول با موفقیت ایجاد شد
              </h2>

              <p className="text-zinc-400">
                محصول شما با موفقیت در سیستم ثبت شده است.
                اکنون می‌توانید طعم‌های این محصول را اضافه کنید.
              </p>

              <p className="text-sm text-zinc-500">
                شناسه محصول: {createdProductId}
              </p>
            </div>

            <div
              className="
                p-8
                rounded-3xl
                border border-white/10
                bg-white/[0.02]
                space-y-6
              "
            >
              <div>
                <h2 className="text-2xl font-semibold">
                  طعم‌های محصول
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  نام طعم، موجودی و قیمت اضافی آن را وارد کنید.
                </p>
              </div>

              <FlavorManager
                productId={createdProductId}
              />
            </div>

            <div className="flex gap-4">

              <button
                type="button"
                onClick={handleFinish}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-violet-600
                  hover:bg-violet-500
                  transition-colors
                  font-semibold
                "
              >
                اتمام و بازگشت به محصولات
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedProductId(null);

                  setForm({
                    title: "",
                    slug: "",
                    description: "",
                    price: "",
                    stock: "",
                    categoryId: "",
                    isActive: true,
                    isFeatured: false,
                    images: [],
                  });

                  setSpecs([
                    {
                      key: "",
                      value: "",
                    },
                  ]);
                }}
                className="
                  px-6
                  py-4
                  rounded-2xl
                  border border-white/10
                  text-zinc-300
                  hover:border-white/30
                  hover:text-white
                  transition-colors
                "
              >
                افزودن محصول جدید
              </button>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}