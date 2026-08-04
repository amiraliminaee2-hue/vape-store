// app/api/admin/products/[id]/flavors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

const flavorSchema = z.object({
  name: z.string().min(1, "نام طعم الزامی است"),
  stock: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
  price: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

const updateFlavorSchema = z.object({
  flavorId: z.number().min(1, "شناسه طعم الزامی است"),
  name: z.string().min(1, "نام طعم الزامی است"),
  stock: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
  price: z.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }

    const flavors = await prisma.flavor.findMany({
      where: { productId: productId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(flavors);
  } catch (error) {
    console.error("GET flavors error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت طعم‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validationResult = flavorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, stock, price, isActive } = validationResult.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    const existingFlavor = await prisma.flavor.findUnique({
      where: {
        productId_name: {
          productId: productId,
          name: name,
        },
      },
    });

    if (existingFlavor) {
      return NextResponse.json(
        { error: "این طعم قبلاً برای این محصول ثبت شده است" },
        { status: 400 }
      );
    }

    const flavor = await prisma.flavor.create({
      data: {
        productId: productId,
        name: name,
        stock: stock,
        price: price || null,
        isActive: isActive,
      },
    });

    return NextResponse.json(flavor, { status: 201 });
  } catch (error) {
    console.error("POST flavor error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد طعم" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validationResult = updateFlavorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { flavorId, name, stock, price, isActive } = validationResult.data;

    const existingFlavor = await prisma.flavor.findFirst({
      where: {
        id: flavorId,
        productId: productId,
      },
    });

    if (!existingFlavor) {
      return NextResponse.json(
        { error: "طعم یافت نشد" },
        { status: 404 }
      );
    }

    if (name !== existingFlavor.name) {
      const duplicate = await prisma.flavor.findUnique({
        where: {
          productId_name: {
            productId: productId,
            name: name,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "این طعم قبلاً برای این محصول ثبت شده است" },
          { status: 400 }
        );
      }
    }

    const flavor = await prisma.flavor.update({
      where: { id: flavorId },
      data: {
        name: name,
        stock: stock,
        price: price !== undefined ? price : existingFlavor.price,
        isActive: isActive,
      },
    });

    return NextResponse.json(flavor);
  } catch (error) {
    console.error("PUT flavor error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی طعم" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const flavorId = parseInt(searchParams.get("flavorId") || "0");

    if (!flavorId || isNaN(flavorId)) {
      return NextResponse.json(
        { error: "شناسه طعم الزامی است" },
        { status: 400 }
      );
    }

    const existingFlavor = await prisma.flavor.findFirst({
      where: {
        id: flavorId,
        productId: productId,
      },
    });

    if (!existingFlavor) {
      return NextResponse.json(
        { error: "طعم یافت نشد" },
        { status: 404 }
      );
    }

    await prisma.flavor.delete({
      where: { id: flavorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE flavor error:", error);
    return NextResponse.json(
      { error: "خطا در حذف طعم" },
      { status: 500 }
    );
  }
}