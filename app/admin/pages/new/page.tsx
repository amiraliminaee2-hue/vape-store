"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
}

export default function NewPagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    image: "",
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // تولید خودکار slug از title
  const generateSlug = (): void => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/pages");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در ایجاد صفحه");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/pages"
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors"
        >
          →
        </Link>
        <h1 className="text-4xl font-bold">صفحه جدید</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">عنوان صفحه *</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              تولید slug
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">slug *</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none font-mono"
            required
            placeholder="example-page"
          />
          <p className="text-xs text-zinc-500 mt-1">آدرس صفحه: yoursite.com/{formData.slug || "..."}</p>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">خلاصه (برای SEO)</label>
          <input
            type="text"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
            placeholder="توضیح کوتاه برای موتورهای جستجو"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">تصویر شاخص</label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">محتوا *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={15}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none font-mono text-sm"
            required
            placeholder="محتوا به صورت HTML یا متن ساده..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">عنوان سئو (meta title)</label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">توضیحات سئو (meta description)</label>
            <input
              type="text"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">وضعیت</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
          >
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر شده</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره صفحه"}
          </button>
          <Link
            href="/admin/pages"
            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}