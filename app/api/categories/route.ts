import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { z } from "zod";

// Schema validation for POST request body
const postBodySchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی حداقل ۲ کاراکتر باید باشد").max(100, "نام دسته‌بندی حداکثر ۱۰۰ کاراکتر است"),
  slug: z.string().min(2, "slug حداقل ۲ کاراکتر باید باشد").max(100, "slug حداکثر ۱۰۰ کاراکتر است").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug نامعتبر است"),
  description: z.string().optional().nullable(),
  image: z.string().url("آدرس تصویر نامعتبر است").optional().nullable(),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories API Error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate body with Zod
    const bodyValidationResult = postBodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { name, slug, description, image } = bodyValidationResult.data;

    const category = await prisma.category.create({
      data: { name, slug, description, image },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}