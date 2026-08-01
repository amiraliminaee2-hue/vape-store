// app/api/admin/shipping-methods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

// GET - لیست روش‌های ارسال
export async function GET() {
  try {
    const prisma = await getPrisma();
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

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await req.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ ایجاد روش ارسال جدید (CREATE)
    // ============================================
    if (action === "create") {
      const { name, code, basePrice, pricePerKg, estimatedDays } = data;

      if (!name || !code || basePrice === undefined) {
        return NextResponse.json(
          { error: "نام، کد و قیمت پایه الزامی است" },
          { status: 400 }
        );
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
    }

    // ============================================
    // 2️⃣ ویرایش روش ارسال (UPDATE)
    // ============================================
    if (action === "update") {
      const {
        id,
        name,
        code,
        basePrice,
        pricePerKg,
        estimatedDays,
      } = data;

      if (!id) {
        return NextResponse.json(
          { error: "آیدی الزامی است" },
          { status: 400 }
        );
      }

      const method = await prisma.shippingMethod.update({
        where: {
          id: parseInt(id.toString()),
        },
        data: {
          name,
          code,
          basePrice,
          pricePerKg: pricePerKg || null,
          estimatedDays: estimatedDays || null,
          isActive: data.isActive,
        },
      });

      return NextResponse.json(method);
    }

    // ============================================
    // 3️⃣ حذف روش ارسال (DELETE)
    // ============================================
    if (action === "delete") {
      // ابتدا از body دریافت کن
      let { id } = data;
      
      // اگر در body نبود، از query params دریافت کن (برای سازگاری با کد قدیمی)
      if (!id) {
        const { searchParams } = new URL(req.url);
        id = parseInt(searchParams.get("id")!);
      }

      if (!id) {
        return NextResponse.json(
          { error: "آیدی الزامی است" },
          { status: 400 }
        );
      }

      await prisma.shippingMethod.delete({
        where: { id: parseInt(id.toString()) },
      });

      return NextResponse.json({ success: true });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in shipping method operation:", error);
    return NextResponse.json(
      { error: "خطا در عملیات روش ارسال" },
      { status: 500 }
    );
  }
}