import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";

// GET - دریافت لیست کدهای تخفیف (ادمین) یا اعتبارسنجی یک کد (عمومی)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

// POST - ایجاد کد تخفیف جدید (فقط ادمین)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

    if (!code || !value || value <= 0) {
      return NextResponse.json({ error: "کد تخفیف و مقدار تخفیف الزامی است" }, { status: 400 });
    }

    // بررسی تکراری نبودن کد
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "این کد تخفیف قبلاً ثبت شده است" }, { status: 400 });
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
  } catch (error) {
    console.error("Coupons POST error:", error);
    return NextResponse.json({ error: "خطا در ایجاد کد تخفیف" }, { status: 500 });
  }
}

// PUT - بروزرسانی کد تخفیف (فقط ادمین)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه کد تخفیف الزامی است" }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.type && { type: data.type }),
        ...(data.value && { value: data.value }),
        ...(data.minPurchase !== undefined && { minPurchase: data.minPurchase || null }),
        ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount || null }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit || null }),
        ...(data.perUserLimit !== undefined && { perUserLimit: data.perUserLimit || null }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.status && { status: data.status }),
        ...(data.applicableProducts && { applicableProducts: data.applicableProducts }),
        ...(data.applicableCategories && { applicableCategories: data.applicableCategories }),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("Coupons PUT error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی کد تخفیف" }, { status: 500 });
  }
}

// DELETE - حذف کد تخفیف (فقط ادمین)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "شناسه کد تخفیف الزامی است" }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupons DELETE error:", error);
    return NextResponse.json({ error: "خطا در حذف کد تخفیف" }, { status: 500 });
  }
}