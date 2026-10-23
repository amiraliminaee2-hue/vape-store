"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

interface ImportError {
  row: Record<string, string>;
  error: string;
  rowNumber: number;
}

interface ImportResult {
  imported: number;
  total: number;
  errors: ImportError[];
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
  flavors: string;
  flavor_stock: string;
}

const SAMPLE_HEADERS: Array<keyof SampleProduct> = [
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
  "flavors",
  "flavor_stock",
];

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    title: "نمونه پاد دائم",
    slug: "sample-permanent-pod",
    description: "توضیحات نمونه محصول پاد دائم",
    price: 3200000,
    stock: 10,
    category: "پاد دائم",
    category_slug: "permanent-pod",
    images: "",
    isActive: "true",
    isFeatured: "false",
    specs:
      '[{"key":"باتری","value":"1000mAh"},{"key":"توان","value":"25W"}]',
    flavors: "",
    flavor_stock: "",
  },
  {
    title: "نمونه پاد موقت",
    slug: "sample-disposable-pod",
    description: "توضیحات نمونه محصول پاد موقت",
    price: 450000,
    stock: 20,
    category: "پاد موقت",
    category_slug: "disposable-pod",
    images: "",
    isActive: "true",
    isFeatured: "false",
    specs:
      '[{"key":"ظرفیت","value":"5000 پاف"},{"key":"نیکوتین","value":"5%"}]',
    flavors: "توت فرنگی | هندوانه | انگور",
    flavor_stock: "5 | 8 | 7",
  },
  {
    title: "نمونه جویس",
    slug: "sample-juice",
    description: "توضیحات نمونه محصول جویس",
    price: 850000,
    stock: 15,
    category: "جویس",
    category_slug: "juice",
    images: "",
    isActive: "true",
    isFeatured: "false",
    specs:
      '[{"key":"حجم","value":"60ml"},{"key":"نیکوتین","value":"3mg"}]',
    flavors: "توت فرنگی | بلوبری",
    flavor_stock: "6 | 9",
  },
];

export default function ImportProductsPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] =
    useState<ImportResult | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setResult(null);
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!file) {
      alert("لطفاً فایل CSV یا Excel را انتخاب کنید");
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "/api/admin/products/import",
        {
          method: "POST",
          body: formData,
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "خطا در وارد کردن محصولات";

        alert(errorMessage);
        return;
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("imported" in data) ||
        !("total" in data) ||
        !("errors" in data)
      ) {
        alert(
          "پاسخ نامعتبر از سرور دریافت شد."
        );
        return;
      }

      const imported = data.imported;
      const total = data.total;
      const errors = data.errors;

      if (
        typeof imported !== "number" ||
        typeof total !== "number" ||
        !Array.isArray(errors)
      ) {
        alert(
          "ساختار پاسخ سرور نامعتبر است."
        );
        return;
      }

      const importResult: ImportResult = {
        imported,
        total,
        errors:
          errors as ImportError[],
      };

      setResult(importResult);

      if (imported > 0) {
        alert(
          `${imported} محصول با موفقیت وارد شد`
        );
      }

      if (errors.length > 0) {
        alert(
          `${errors.length} مورد با خطا مواجه شد`
        );
      }
    } catch (error) {
      console.error(
        "Import error:",
        error
      );

      alert(
        "خطا در ارتباط با سرور هنگام وارد کردن محصولات"
      );
    } finally {
      setLoading(false);
    }
  };

  const escapeCsvValue = (
    value: string | number
  ): string => {
    return `"${String(value).replace(
      /"/g,
      '""'
    )}"`;
  };

  const downloadSampleCSV = (): void => {
    const csvRows: string[] = [
      SAMPLE_HEADERS.join(","),
    ];

    for (const product of SAMPLE_PRODUCTS) {
      const row = SAMPLE_HEADERS.map(
        (header) =>
          escapeCsvValue(product[header])
      );

      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "sample_products.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = (): void => {
    const worksheet =
      XLSX.utils.json_to_sheet(
        SAMPLE_PRODUCTS,
        {
          header: SAMPLE_HEADERS,
        }
      );

    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 28 },
      { wch: 40 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 45 },
      { wch: 12 },
      { wch: 14 },
      { wch: 60 },
      { wch: 40 },
      { wch: 25 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Products"
    );

    XLSX.writeFile(
      workbook,
      "sample_products.xlsx"
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto">

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
            ورود دسته‌ای محصولات
          </h1>
        </div>

        <div className="space-y-8">

          {/* راهنما */}
          <div
            className="
              p-6
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
            "
          >
            <h2 className="text-xl font-semibold mb-5">
              راهنمای فایل CSV / Excel
            </h2>

            <div className="space-y-3 text-sm text-zinc-400">

              <p>
                <span className="text-violet-400">
                  title
                </span>
                {" — "}
                نام محصول؛ الزامی.
              </p>

              <p>
                <span className="text-violet-400">
                  slug
                </span>
                {" — "}
                آدرس یکتا؛ اختیاری است و در صورت خالی
                بودن از عنوان ساخته می‌شود.
              </p>

              <p>
                <span className="text-violet-400">
                  description
                </span>
                {" — "}
                توضیحات محصول.
              </p>

              <p>
                <span className="text-violet-400">
                  price
                </span>
                {" — "}
                قیمت به تومان؛ عدد صحیح صفر یا بیشتر.
              </p>

              <p>
                <span className="text-violet-400">
                  stock
                </span>
                {" — "}
                موجودی کل محصول.
              </p>

              <p>
                <span className="text-violet-400">
                  category
                </span>
                {" — "}
                نام دسته‌بندی موجود در سایت.
              </p>

              <p>
                <span className="text-violet-400">
                  category_slug
                </span>
                {" — "}
                slug دسته‌بندی موجود در سایت.
              </p>

              <p>
                <span className="text-violet-400">
                  images
                </span>
                {" — "}
                آدرس تصاویر؛ چند تصویر با کاما جدا شوند.
              </p>

              <p>
                <span className="text-violet-400">
                  isActive
                </span>
                {" — "}
                وضعیت محصول؛ true یا false.
              </p>

              <p>
                <span className="text-violet-400">
                  isFeatured
                </span>
                {" — "}
                وضعیت پرفروش؛ true یا false.
              </p>

              <p>
                <span className="text-violet-400">
                  specs
                </span>
                {" — "}
                مشخصات فنی به صورت JSON.
              </p>

              <p>
                <span className="text-violet-400">
                  flavors
                </span>
                {" — "}
                نام طعم‌ها که با | از هم جدا می‌شوند.
              </p>

              <p>
                <span className="text-violet-400">
                  flavor_stock
                </span>
                {" — "}
                موجودی طعم‌ها با | از هم جدا می‌شوند؛
                ترتیب آن باید دقیقاً با ستون flavors یکسان باشد.
              </p>

            </div>

            <div
              className="
                mt-6
                p-4
                rounded-2xl
                bg-violet-500/5
                border border-violet-500/20
              "
            >
              <p className="text-sm text-violet-300">
                مثال طعم‌ها
              </p>

              <p className="text-xs text-zinc-500 mt-2 leading-6">
                flavors:
                {" "}
                توت فرنگی | هندوانه | انگور
                <br />
                flavor_stock:
                {" "}
                ۱۰ | ۵ | ۸
              </p>

              <p className="text-xs text-zinc-600 mt-2">
                یعنی موجودی توت فرنگی ۱۰، هندوانه ۵ و
                انگور ۸ عدد است.
              </p>
            </div>
          </div>

          {/* دانلود نمونه */}
          <div
            className="
              p-6
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
            "
          >
            <h2 className="text-xl font-semibold mb-2">
              دانلود نمونه فایل
            </h2>

            <p className="text-sm text-zinc-500 mb-5">
              نمونه زیر دقیقاً با ساختار Import جدید سایت
              هماهنگ است.
            </p>

            <div className="flex gap-4 flex-wrap">
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="
                  px-6 py-3
                  rounded-xl
                  bg-violet-600
                  hover:bg-violet-500
                  transition-colors
                "
              >
                📥 دانلود نمونه CSV
              </button>

              <button
                type="button"
                onClick={downloadSampleExcel}
                className="
                  px-6 py-3
                  rounded-xl
                  bg-emerald-600
                  hover:bg-emerald-500
                  transition-colors
                "
              >
                📊 دانلود نمونه Excel
              </button>
            </div>
          </div>

          {/* آپلود */}
          <div
            className="
              p-6
              rounded-3xl
              border border-white/10
              bg-white/[0.02]
            "
          >
            <h2 className="text-xl font-semibold mb-5">
              آپلود فایل
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="
                    block
                    w-full
                    text-sm
                    text-zinc-400

                    file:mr-4
                    file:py-2
                    file:px-4
                    file:rounded-full
                    file:border-0

                    file:text-sm
                    file:font-semibold
                    file:bg-violet-600
                    file:text-white

                    hover:file:bg-violet-500

                    disabled:opacity-50
                  "
                />

                <p className="text-xs text-zinc-500 mt-2">
                  فرمت‌های مجاز: CSV، Excel (xlsx, xls)
                </p>

                {file && (
                  <p className="text-xs text-violet-400 mt-2">
                    فایل انتخاب‌شده:{" "}
                    {file.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="
                  w-full
                  py-3
                  rounded-xl
                  bg-green-600
                  hover:bg-green-500
                  transition-colors
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {loading
                  ? "در حال وارد کردن..."
                  : "شروع وارد کردن محصولات"}
              </button>
            </form>
          </div>

          {/* نتیجه */}
          {result && (
            <div
              className="
                p-6
                rounded-3xl
                border border-white/10
                bg-white/[0.02]
              "
            >
              <h2 className="text-xl font-semibold mb-5">
                نتیجه وارد کردن
              </h2>

              <div className="space-y-3">
                <p>
                  ✅ وارد شده:
                  {" "}
                  {result.imported}
                  {" "}
                  از
                  {" "}
                  {result.total}
                </p>

                {result.errors.length > 0 && (
                  <p className="text-red-400">
                    ❌ خطا:
                    {" "}
                    {result.errors.length}
                    {" "}
                    مورد
                  </p>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-red-400">
                    جزئیات خطاها
                  </h3>

                  {result.errors.map(
                    (item) => (
                      <div
                        key={`${item.rowNumber}-${item.error}`}
                        className="
                          p-4
                          rounded-xl
                          bg-red-500/5
                          border border-red-500/20
                        "
                      >
                        <p className="text-sm text-red-300">
                          ردیف {item.rowNumber}
                        </p>

                        <p className="text-sm text-zinc-400 mt-1">
                          {item.error}
                        </p>

                        {item.row.title && (
                          <p className="text-xs text-zinc-600 mt-2">
                            محصول:{" "}
                            {item.row.title}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {result.imported > 0 && (
                <Link
                  href="/admin/products"
                  className="
                    inline-block
                    mt-6
                    px-6 py-2
                    rounded-xl
                    bg-violet-600
                    hover:bg-violet-500
                    transition-colors
                  "
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