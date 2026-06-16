import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";

// GET - لیست روش‌های ارسال
export async function GET() {
  try {
    const methods = await prisma.shippingMethod.findMany({
      include: { provincePrices: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return NextResponse.json({ error: "خطا در دریافت روش‌های ارسال" }, { status: 500 });
  }
}

// POST - ایجاد روش ارسال جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, basePrice, pricePerKg, estimatedDays } = body;

    if (!name || !code || basePrice === undefined) {
      return NextResponse.json({ error: "نام، کد و قیمت پایه الزامی است" }, { status: 400 });
    }

    const method = await prisma.shippingMethod.create({
      data: {
        name,
        code,
        basePrice,
        pricePerKg: pricePerKg || null,
        estimatedDays: estimatedDays || null,
      },
    });

    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping method:", error);
    return NextResponse.json({ error: "خطا در ایجاد روش ارسال" }, { status: 500 });
  }
}

// PUT - ویرایش روش ارسال
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, code, basePrice, pricePerKg, estimatedDays, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "آیدی الزامی است" }, { status: 400 });
    }

    const method = await prisma.shippingMethod.update({
      where: { id },
      data: { name, code, basePrice, pricePerKg, estimatedDays, isActive },
    });

    return NextResponse.json(method);
  } catch (error) {
    console.error("Error updating shipping method:", error);
    return NextResponse.json({ error: "خطا در ویرایش روش ارسال" }, { status: 500 });
  }
}

// DELETE - حذف روش ارسال
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id")!);

    if (!id) {
      return NextResponse.json({ error: "آیدی الزامی است" }, { status: 400 });
    }

    await prisma.shippingMethod.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping method:", error);
    return NextResponse.json({ error: "خطا در حذف روش ارسال" }, { status: 500 });
  }
}