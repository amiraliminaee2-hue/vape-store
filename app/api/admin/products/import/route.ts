import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// تعریف تایپ برای داده‌های CSV
interface ProductCSVRow {
  title: string;
  slug?: string;
  description?: string;
  price: string;
  stock: string;
  category?: string;
  category_slug?: string;
  images?: string;
  isActive?: string;
  isFeatured?: string;
  specs?: string;
}

// تعریف تایپ برای مشخصات فنی
interface ProductSpec {
  key: string;
  value: string;
}

// تعریف تایپ برای خطاهای پارس
interface ParseError {
  message: string;
  row?: number;
  code?: string;
}

// تابع تشخیص نوع فایل
function getFileType(filename: string): "csv" | "excel" | "unknown" {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "excel";
  return "unknown";
}

// تابع تبدیل Excel به JSON
function excelToJson(buffer: Buffer): ProductCSVRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<ProductCSVRow>(worksheet);
  return data;
}

// تابع دانلود تصویر از URL و ذخیره در سرور
async function downloadAndSaveImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const webpBuffer = await sharp(Buffer.from(buffer))
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    
    const fileName = `${uuidv4()}.webp`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(uploadDir, fileName), webpBuffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "فایل ارسال نشده است" }, { status: 400 });
    }

    const fileType = getFileType(file.name);
    if (fileType === "unknown") {
      return NextResponse.json({ error: "فرمت فایل پشتیبانی نمی‌شود. فقط CSV و Excel مجاز هستند." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let results: ProductCSVRow[] = [];

    if (fileType === "csv") {
      // Parse CSV
      const text = await file.text();
      results = await new Promise<ProductCSVRow[]>((resolve, reject) => {
        Papa.parse<ProductCSVRow>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result: Papa.ParseResult<ProductCSVRow>) => resolve(result.data),
          error: (error: ParseError) => reject(error),
        });
      });
    } else {
      // Parse Excel
      results = excelToJson(buffer);
    }

    const importedProducts: Array<{ id: number; title: string }> = [];
    const errors: Array<{ row: ProductCSVRow; error: string }> = [];

    for (const row of results) {
      try {
        if (!row.title || !row.price) {
          errors.push({ row, error: "عنوان یا قیمت محصول الزامی است" });
          continue;
        }

        // === بخش اصلاح شده: پیدا کردن یا ایجاد دسته‌بندی ===
        let category = null;
        
        // اول با category_slug پیدا کن
        if (row.category_slug) {
          category = await prisma.category.findUnique({
            where: { slug: row.category_slug },
          });
        }
        
        // اگر پیدا نشد و category داریم، با name پیدا کن
        if (!category && row.category) {
          category = await prisma.category.findFirst({
            where: { name: row.category },
          });
        }
        
        // اگر باز هم پیدا نشد و category داریم، دسته جدید بساز
        if (!category && row.category) {
          const slugToUse = row.category_slug || row.category.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
          
          category = await prisma.category.create({
            data: {
              name: row.category,
              slug: slugToUse,
            },
          });
        }

        // پردازش تصاویر
        const imageUrls: string[] = [];
        if (row.images) {
          const imageList = row.images.split(",").map((img: string) => img.trim());
          for (const imgUrl of imageList) {
            if (imgUrl.startsWith("http")) {
              const savedUrl = await downloadAndSaveImage(imgUrl);
              if (savedUrl) imageUrls.push(savedUrl);
            } else {
              imageUrls.push(imgUrl);
            }
          }
        }

        // ایجاد slug اگر وجود نداشت
        const slug = row.slug || row.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");

        // ایجاد محصول
        const product = await prisma.product.create({
          data: {
            title: row.title,
            slug: slug,
            description: row.description || "",
            price: parseInt(row.price) || 0,
            stock: parseInt(row.stock) || 0,
            images: imageUrls,
            isActive: row.isActive === "true" || row.isActive === "1" || true,
            isFeatured: row.isFeatured === "true" || row.isFeatured === "1" || false,
            categoryId: category?.id || 1, // اگر دسته‌ای نبود، از دسته پیش‌فرض با id=1 استفاده کن
          },
        });

        // ایجاد مشخصات فنی
        if (row.specs) {
          try {
            const specs = JSON.parse(row.specs) as ProductSpec[];
            if (Array.isArray(specs)) {
              for (const spec of specs) {
                if (spec.key && spec.value) {
                  await prisma.productSpec.create({
                    data: {
                      key: spec.key,
                      value: spec.value,
                      productId: product.id,
                    },
                  });
                }
              }
            }
          } catch {
            // اگر JSON نبود، نادیده بگیر
          }
        }

        importedProducts.push({ id: product.id, title: product.title });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({ row, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedProducts.length,
      errors: errors,
      total: results.length,
    });
  } catch (err) {
    console.error("Import products error:", err);
    const errorMessage = err instanceof Error ? err.message : "خطا در وارد کردن محصولات";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}