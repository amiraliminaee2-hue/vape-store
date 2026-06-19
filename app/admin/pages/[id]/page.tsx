"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
}

interface FormData {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
}

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.["id"] as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const fetchPage = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/pages?slug=${id}`);
      const data: Page = await res.json();
      if (data.id) {
        setFormData(data);
      } else {
        router.push("/admin/pages");
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      router.push("/admin/pages");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const generateSlug = (): void => {
    if (!formData) return;
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formData.id,
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt,
          image: formData.image,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          status: formData.status,
        }),
      });

      if (res.ok) {
        router.push("/admin/pages");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در بروزرسانی صفحه");
      }
    } catch (error) {
      console.error("Error updating page:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center py-20">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/pages"
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors"
        >
          →
        </Link>
        <h1 className="text-4xl font-bold">ویرایش صفحه</h1>
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
          />
          <p className="text-xs text-zinc-500 mt-1">آدرس صفحه: yoursite.com/{formData.slug}</p>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">خلاصه (برای SEO)</label>
          <input
            type="text"
            name="excerpt"
            value={formData.excerpt || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">تصویر شاخص</label>
          <input
            type="text"
            name="image"
            value={formData.image || ""}
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
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">عنوان سئو (meta title)</label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">توضیحات سئو (meta description)</label>
            <input
              type="text"
              name="metaDescription"
              value={formData.metaDescription || ""}
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
            <option value="ARCHIVED">بایگانی شده</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
          <Link
            href={`/${formData.slug}`}
            target="_blank"
            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            🔍 مشاهده در سایت
          </Link>
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