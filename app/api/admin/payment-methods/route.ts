import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - لیست روش‌های پرداخت
export async function GET() {
  try {
    const prisma = await getPrisma();
    
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ error: "خطا در دریافت روش‌های پرداخت" }, { status: 500 });
  }
}

// POST - ایجاد روش پرداخت جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, isActive, settings } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "نام و کد روش پرداخت الزامی است" }, { status: 400 });
    }

    const prisma = await getPrisma();

    const method = await prisma.paymentMethod.create({
      data: {
        name,
        code,
        isActive: isActive ?? true,
        settings: settings || {},
      },
    });

    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error("Error creating payment method:", error);
    return NextResponse.json({ error: "خطا در ایجاد روش پرداخت" }, { status: 500 });
  }
}

// PUT - ویرایش روش پرداخت
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, code, isActive, settings } = body;

    if (!id) {
      return NextResponse.json({ error: "آیدی الزامی است" }, { status: 400 });
    }

    const prisma = await getPrisma();

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { name, code, isActive, settings },
    });

    return NextResponse.json(method);
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json({ error: "خطا در ویرایش روش پرداخت" }, { status: 500 });
  }
}

// DELETE - حذف روش پرداخت
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

    const prisma = await getPrisma();

    await prisma.paymentMethod.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json({ error: "خطا در حذف روش پرداخت" }, { status: 500 });
  }
}