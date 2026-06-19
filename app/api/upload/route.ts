import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "فایلی ارسال نشده است" },
        { status: 400 }
      );
    }

    // بررسی نوع فایل
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع فایل مجاز نیست. فقط JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // بررسی حجم فایل (حداکثر ۵ مگابایت)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل باید کمتر از ۵ مگابایت باشد" },
        { status: 400 }
      );
    }

    // ایجاد نام یکتا برای فایل
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const webpFileName = `${uuidv4()}.webp`;
    
    // مسیر ذخیره‌سازی
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // اطمینان از وجود پوشه
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // پوشه از قبل وجود دارد
    }

    // بهینه‌سازی و تبدیل به WebP
    const webpBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // ذخیره فایل WebP
    const webpPath = path.join(uploadDir, webpFileName);
    await writeFile(webpPath, webpBuffer);

    // آدرس فایل برای ذخیره در دیتابیس
    const fileUrl = `/uploads/${webpFileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: webpFileName,
      size: webpBuffer.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    );
  }
}