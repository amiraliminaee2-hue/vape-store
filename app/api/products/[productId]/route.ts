import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { z } from "zod";
import { sanitizeHtml } from "../../../../lib/sanitize";

// Schema validation for params
const paramsSchema = z.object({
  productId: z.string().regex(/^\d+$/, "productId باید عدد باشد"),
});

// Schema validation for PUT request body
const specsItemSchema = z.object({
  key: z.string().min(1, "کلید مشخصات نمی‌تواند خالی باشد"),
  value: z.string().min(1, "مقدار مشخصات نمی‌تواند خالی باشد"),
});

const putBodySchema = z.object({
  title: z.string().min(2, "عنوان محصول حداقل ۲ کاراکتر باید باشد").max(200, "عنوان محصول حداکثر ۲۰۰ کاراکتر است"),
  slug: z.string().min(2, "slug حداقل ۲ کاراکتر باید باشد").max(200, "slug حداکثر ۲۰۰ کاراکتر است").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug نامعتبر است"),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val)).pipe(z.number().min(0, "قیمت نمی‌تواند منفی باشد")),
  discountPercent: z.union([z.string(), z.number()]).optional().transform((val) => val ? Number(val) : 0).pipe(z.number().min(0, "درصد تخفیف نمی‌تواند منفی باشد").max(100, "درصد تخفیف نمی‌تواند بیشتر از 100 باشد")),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val)).pipe(z.number().int("موجودی باید عدد صحیح باشد").min(0, "موجودی نمی‌تواند منفی باشد")),
  images: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  categoryId: z.union([z.string(), z.number()]).transform((val) => Number(val)).pipe(z.number().int("categoryId باید عدد صحیح باشد").positive("categoryId نامعتبر است")),
  specs: z.array(specsItemSchema).optional().default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const paramsValidationResult = paramsSchema.safeParse({ productId });
    if (!paramsValidationResult.success) {
      return NextResponse.json(
        { error: "پارامتر نامعتبر", details: paramsValidationResult.error.issues },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { category: true, specs: true },
    });

    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const similarProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        price: true,
        discountPercent: true,
        stock: true,
        isFeatured: true,
        images: true,
      },
    });

    return NextResponse.json({
      ...product,
      discountPercent: product.discountPercent || 0,
      similarProducts,
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({ error: "خطا در دریافت محصول" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const paramsValidationResult = paramsSchema.safeParse({ productId });
    if (!paramsValidationResult.success) {
      return NextResponse.json(
        { error: "پارامتر نامعتبر", details: paramsValidationResult.error.issues },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyValidationResult = putBodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        { error: "ورودی نامعتبر", details: bodyValidationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      description,
      price,
      discountPercent,
      stock,
      images,
      isActive,
      isFeatured,
      categoryId,
      specs,
    } = bodyValidationResult.data;

    const sanitizedDescription = description ? sanitizeHtml(description) : "";

    await prisma.productSpec.deleteMany({
      where: { productId: parseInt(productId) },
    });

    const product = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        title,
        slug,
        description: sanitizedDescription,
        price,
        discountPercent: discountPercent !== undefined ? discountPercent : 0,
        stock,
        images: images || [],
        isActive,
        isFeatured,
        categoryId,
        specs: {
          create: specs?.map((s) => ({ key: s.key, value: s.value })) || [],
        },
      },
      include: { category: true, specs: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "خطا در ویرایش محصول" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const paramsValidationResult = paramsSchema.safeParse({ productId });
    if (!paramsValidationResult.success) {
      return NextResponse.json(
        { error: "پارامتر نامعتبر", details: paramsValidationResult.error.issues },
        { status: 400 }
      );
    }

    const id = parseInt(productId);

    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: id } });
    await prisma.comment.deleteMany({ where: { productId: id } });
    await prisma.productSpec.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در حذف محصول" },
      { status: 500 }
    );
  }
}