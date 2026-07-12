// app/api/admin/province-prices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

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
    // 1️⃣ ایجاد یا ویرایش قیمت استان (CREATE/UPDATE)
    // ============================================
    if (action === "set" || action === "create" || action === "update") {
      const { province, shippingMethodId, price } = data;

      if (!province || !shippingMethodId || price === undefined) {
        return NextResponse.json(
          { error: "استان، روش ارسال و قیمت الزامی است" },
          { status: 400 }
        );
      }

      const provincePrice = await prisma.provinceShippingPrice.upsert({
        where: {
          province_shippingMethodId: {
            province,
            shippingMethodId,
          },
        },
        update: { price },
        create: { province, shippingMethodId, price },
      });

      return NextResponse.json(provincePrice);
    }

    // ============================================
    // 2️⃣ حذف قیمت استان (DELETE)
    // ============================================
    if (action === "delete") {
      const { id } = data;

      if (!id) {
        return NextResponse.json(
          { error: "آیدی الزامی است" },
          { status: 400 }
        );
      }

      await prisma.provinceShippingPrice.delete({
        where: { id: parseInt(id.toString()) },
      });

      return NextResponse.json({ success: true });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: set, create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in province price operation:", error);
    return NextResponse.json(
      { error: "خطا در عملیات قیمت استان" },
      { status: 500 }
    );
  }
}