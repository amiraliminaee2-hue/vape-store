// app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

// GET - دریافت لیست کدهای تخفیف (ادمین) یا اعتبارسنجی یک کد (عمومی)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const subtotal = parseInt(searchParams.get("subtotal") || "0");
    const productIds = searchParams.get("productIds")?.split(",").map(Number) || [];

    // اعتبارسنجی یک کد تخفیف (برای سبد خرید)
    if (code) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json({ valid: false, error: "کد تخفیف نامعتبر است" });
      }

      // بررسی وضعیت
      if (coupon.status !== "ACTIVE") {
        return NextResponse.json({ valid: false, error: "کد تخفیف غیرفعال است" });
      }

      // بررسی تاریخ
      const now = new Date();
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        return NextResponse.json({ valid: false, error: "زمان استفاده از این کد تخفیف هنوز فرا نرسیده است" });
      }
      if (coupon.endDate && new Date(coupon.endDate) < now) {
        return NextResponse.json({ valid: false, error: "کد تخفیف منقضی شده است" });
      }

      // بررسی محدودیت تعداد استفاده
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ valid: false, error: "تعداد استفاده از این کد تخفیف به پایان رسیده است" });
      }

      // بررسی حداقل مبلغ خرید
      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        return NextResponse.json({ 
          valid: false, 
          error: `حداقل مبلغ خرید برای استفاده از این کد تخفیف ${coupon.minPurchase.toLocaleString()} تومان است` 
        });
      }

      // بررسی محدودیت محصولات
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(id => coupon.applicableProducts.includes(id));
        if (!hasApplicableProduct) {
          return NextResponse.json({ valid: false, error: "این کد تخفیف برای محصولات موجود در سبد خرید شما قابل استفاده نیست" });
        }
      }

      // محاسبه مبلغ تخفیف
      let discountAmount = 0;
      if (coupon.type === "FIXED") {
        discountAmount = Math.min(coupon.value, subtotal);
      } else {
        discountAmount = Math.floor(subtotal * coupon.value / 100);
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      }

      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount,
        },
      });
    }

    // ادمین: دریافت لیست کدهای تخفیف
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Coupons GET error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات" }, { status: 500 });
  }
}

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ ایجاد کد تخفیف جدید (CREATE)
    // ============================================
    if (action === "create") {
      const {
        code,
        type,
        value,
        minPurchase,
        maxDiscount,
        usageLimit,
        perUserLimit,
        startDate,
        endDate,
        applicableProducts,
        applicableCategories,
      } = data;

      if (!code || !value || value <= 0) {
        return NextResponse.json(
          { error: "کد تخفیف و مقدار تخفیف الزامی است" },
          { status: 400 }
        );
      }

      // بررسی تکراری نبودن کد
      const existing = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "این کد تخفیف قبلاً ثبت شده است" },
          { status: 400 }
        );
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          type: type || "FIXED",
          value,
          minPurchase: minPurchase || null,
          maxDiscount: maxDiscount || null,
          usageLimit: usageLimit || null,
          perUserLimit: perUserLimit || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          applicableProducts: applicableProducts || [],
          applicableCategories: applicableCategories || [],
          status: "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, coupon });
    }

    // ============================================
    // 2️⃣ بروزرسانی کد تخفیف (UPDATE)
    // ============================================
    if (action === "update") {
      const { id, ...updateData } = data;

      if (!id) {
        return NextResponse.json(
          { error: "شناسه کد تخفیف الزامی است" },
          { status: 400 }
        );
      }

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...(updateData.code && { code: updateData.code.toUpperCase() }),
          ...(updateData.type && { type: updateData.type }),
          ...(updateData.value && { value: updateData.value }),
          ...(updateData.minPurchase !== undefined && { minPurchase: updateData.minPurchase || null }),
          ...(updateData.maxDiscount !== undefined && { maxDiscount: updateData.maxDiscount || null }),
          ...(updateData.usageLimit !== undefined && { usageLimit: updateData.usageLimit || null }),
          ...(updateData.perUserLimit !== undefined && { perUserLimit: updateData.perUserLimit || null }),
          ...(updateData.startDate !== undefined && { startDate: updateData.startDate ? new Date(updateData.startDate) : null }),
          ...(updateData.endDate !== undefined && { endDate: updateData.endDate ? new Date(updateData.endDate) : null }),
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.applicableProducts && { applicableProducts: updateData.applicableProducts }),
          ...(updateData.applicableCategories && { applicableCategories: updateData.applicableCategories }),
        },
      });

      return NextResponse.json({ success: true, coupon });
    }

    // ============================================
    // 3️⃣ حذف کد تخفیف (DELETE)
    // ============================================
    if (action === "delete") {
      // ابتدا از body دریافت کن
      let { id } = data;
      
      // اگر در body نبود، از query params دریافت کن (برای سازگاری با کد قدیمی)
      if (!id) {
        const { searchParams } = new URL(request.url);
        id = parseInt(searchParams.get("id") || "0");
      }

      if (!id) {
        return NextResponse.json(
          { error: "شناسه کد تخفیف الزامی است" },
          { status: 400 }
        );
      }

      await prisma.coupon.delete({
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
    console.error("Coupons POST error:", error);
    return NextResponse.json(
      { error: "خطا در عملیات کد تخفیف" },
      { status: 500 }
    );
  }
}