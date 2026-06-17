"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

interface ImportResult {
  imported: number;
  total: number;
  errors: Array<{ row: Record<string, string>; error: string }>;
}

interface SampleProduct {
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  images: string;
  isActive: string;
  isFeatured: string;
  specs: string;
}

export default function ImportProductsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!file) {
      alert("لطفاً فایل CSV یا Excel را انتخاب کنید");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();
      setResult(data);
      
      if (data.imported > 0) {
        alert(`${data.imported} محصول با موفقیت وارد شد`);
      }
      if (data.errors && data.errors.length > 0) {
        console.error("Import errors:", data.errors);
        alert(`${data.errors.length} خطا رخ داد`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("خطا در وارد کردن محصولات");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = (): void => {
    const sampleData: SampleProduct[] = [
      {
        title: "محصول نمونه",
        slug: "product-sample",
        description: "توضیحات محصول نمونه",
        price: 250000,
        stock: 10,
        category: "دستگاه‌ها",
        category_slug: "devices",
        images: "https://example.com/image1.jpg",
        isActive: "true",
        isFeatured: "false",
        specs: '[{"key":"باتری","value":"850mAh"}]',
      },
    ];
    
    const headers: string[] = [
      "title",
      "slug",
      "description",
      "price",
      "stock",
      "category",
      "category_slug",
      "images",
      "isActive",
      "isFeatured",
      "specs",
    ];
    
    const csvRows: string[] = [headers.join(",")];
    for (const product of sampleData) {
      const values = headers.map((header: string) => {
        const value = product[header as keyof SampleProduct] || "";
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = (): void => {
    const sampleData: SampleProduct[] = [
      {
        title: "محصول نمونه 1",
        slug: "product-sample-1",
        description: "توضیحات محصول نمونه 1",
        price: 250000,
        stock: 10,
        category: "دستگاه‌ها",
        category_slug: "devices",
        images: "https://example.com/image1.jpg",
        isActive: "true",
        isFeatured: "false",
        specs: '[{"key":"باتری","value":"850mAh"}]',
      },
      {
        title: "محصول نمونه 2",
        slug: "product-sample-2",
        description: "توضیحات محصول نمونه 2",
        price: 320000,
        stock: 5,
        category: "لیکوئیدها",
        category_slug: "liquids",
        images: "https://example.com/image2.jpg,https://example.com/image3.jpg",
        isActive: "true",
        isFeatured: "true",
        specs: '[{"key":"نیکوتین","value":"3mg"}]',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "sample_products.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors"
          >
            →
          </button>
          <h1 className="text-3xl font-bold">ورود دسته‌ای محصولات</h1>
        </div>

        <div className="space-y-8">
          {/* راهنما */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-semibold mb-4">راهنمای فایل CSV / Excel</h2>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• <span className="text-violet-400">title</span> - عنوان محصول (الزامی)</li>
              <li>• <span className="text-violet-400">slug</span> - آدرس یکتا (اختیاری، از title ساخته می‌شود)</li>
              <li>• <span className="text-violet-400">description</span> - توضیحات محصول</li>
              <li>• <span className="text-violet-400">price</span> - قیمت به تومان</li>
              <li>• <span className="text-violet-400">stock</span> - موجودی انبار</li>
              <li>• <span className="text-violet-400">category</span> - نام دسته‌بندی</li>
              <li>• <span className="text-violet-400">category_slug</span> - slug دسته‌بندی</li>
              <li>• <span className="text-violet-400">images</span> - آدرس تصاویر با کاما جدا شده</li>
              <li>• <span className="text-violet-400">isActive</span> - true/false</li>
              <li>• <span className="text-violet-400">isFeatured</span> - true/false</li>
              <li>• <span className="text-violet-400">specs</span> - JSON آرایه مشخصات</li>
            </ul>
          </div>

          {/* دانلود نمونه فایل */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-semibold mb-4">۱. دانلود نمونه فایل</h2>
            <div className="flex gap-4">
              <button
                onClick={downloadSampleCSV}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                📥 دانلود نمونه CSV
              </button>
              <button
                onClick={downloadSampleExcel}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                📊 دانلود نمونه Excel
              </button>
            </div>
          </div>

          {/* آپلود فایل */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-semibold mb-4">۲. آپلود فایل</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-600 file:text-white
                    hover:file:bg-violet-500"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  فرمت‌های مجاز: CSV، Excel (xlsx, xls)
                </p>
              </div>
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "در حال وارد کردن..." : "شروع وارد کردن محصولات"}
              </button>
            </form>
          </div>

          {/* نتیجه */}
          {result && (
            <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-semibold mb-4">نتیجه وارد کردن</h2>
              <div className="space-y-2">
                <p>✅ وارد شده: {result.imported} از {result.total}</p>
                {result.errors.length > 0 && (
                  <p className="text-red-400">❌ خطا: {result.errors.length} مورد</p>
                )}
              </div>
              {result.imported > 0 && (
                <Link
                  href="/admin/products"
                  className="inline-block mt-4 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
                >
                  مشاهده محصولات
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}