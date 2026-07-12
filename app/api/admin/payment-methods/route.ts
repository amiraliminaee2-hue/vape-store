// app/api/admin/payment-methods/route.ts
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

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    const prisma = await getPrisma();

    // ✅ ایجاد روش پرداخت جدید
    if (action === "create") {
      const { name, code, isActive, settings } = data;

      if (!name || !code) {
        return NextResponse.json(
          { error: "نام و کد روش پرداخت الزامی است" },
          { status: 400 }
        );
      }

      const method = await prisma.paymentMethod.create({
        data: {
          name,
          code,
          isActive: isActive ?? true,
          settings: settings || {},
        },
      });

      return NextResponse.json(method, { status: 201 });
    }

    // ✅ ویرایش روش پرداخت
    if (action === "update") {
      const { id, name, code, isActive, settings } = data;

      if (!id) {
        return NextResponse.json(
          { error: "آیدی الزامی است" },
          { status: 400 }
        );
      }

      const method = await prisma.paymentMethod.update({
        where: { id },
        data: { name, code, isActive, settings },
      });

      return NextResponse.json(method);
    }

    // ✅ حذف روش پرداخت
    if (action === "delete") {
      const { id } = data;

      if (!id) {
        return NextResponse.json(
          { error: "آیدی الزامی است" },
          { status: 400 }
        );
      }

      await prisma.paymentMethod.delete({ where: { id } });

      return NextResponse.json({ success: true });
    }

    // اگر action معتبر نبود
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in payment method operation:", error);
    return NextResponse.json(
      { error: "خطا در انجام عملیات" },
      { status: 500 }
    );
  }
}