import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/validations/schemas";
import { sendOrderConfirmationSMS, sendAdminNotificationSMS } from "@/lib/sms";

// تعریف interface برای Product در بالای فایل
interface Product {
  id: number;
  title: string;
  stock: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری شوید" },
        { status: 401 }
      );
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    // Get user info from our database
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const userName = userProfile?.firstName 
      ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
      : user?.name || "کاربر";

    const userEmail = user?.email || "";

    // Check daily order limit for user (max 5 orders per day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const ordersToday = await prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (ordersToday >= 5) {
      return NextResponse.json(
        { error: "شما امروز حداکثر مجاز ۵ سفارش را ثبت کرده‌اید. لطفاً فردا مجدداً تلاش کنید" },
        { status: 429 }
      );
    }

    const body = await request.json();

    // لاگ برای دیباگ
    console.log("📦 Original body received:", JSON.stringify(body, null, 2));

    // تبدیل null به undefined برای فیلدهای optional
    const cleanedBody = {
      address: body.address,
      phone: body.phone,
      items: body.items,
      customerNote: body.customerNote === null ? undefined : body.customerNote,
      adminNote: body.adminNote === null ? undefined : body.adminNote,
      couponCode: body.couponCode === null ? undefined : body.couponCode,
      discountAmount: body.discountAmount === null ? undefined : body.discountAmount,
      // ✅ اصلاح: تبدیل صحیح فیلدهای روش ارسال و پرداخت
      shippingMethodId: body.shippingMethodId ? Number(body.shippingMethodId) : undefined,
      paymentMethodId: body.paymentMethodId ? Number(body.paymentMethodId) : undefined,
      shippingPrice: body.shippingPrice ? Number(body.shippingPrice) : 0,
    };

    // لاگ برای دیباگ
    console.log("📦 Cleaned body:", JSON.stringify(cleanedBody, null, 2));

    // Zod validation
    const validationResult = orderCreateSchema.safeParse(cleanedBody);
    if (!validationResult.success) {
      console.error("Validation errors:", JSON.stringify(validationResult.error.issues, null, 2));
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      address,
      phone,
      items,
      customerNote,
      adminNote,
      couponCode,
      discountAmount,
      shippingMethodId,
      paymentMethodId,
      shippingPrice,
    } = validationResult.data;

    if (!items?.length) {
      return NextResponse.json(
        { error: "سبد خرید خالی است" },
        { status: 400 }
      );
    }

    let totalPrice = 0;

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: items.map((i: { productId: number }) => i.productId),
        },
      },
    }) as Product[];

    for (const item of items) {
      const product = products.find((p: Product) => p.id === item.productId);

      if (!product) {
        return NextResponse.json(
          { error: "محصول یافت نشد" },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `موجودی ${product.title} کافی نیست` },
          { status: 400 }
        );
      }

      totalPrice += product.price * item.quantity;
    }

    // ==================== اعتبارسنجی کد تخفیف ====================
    let finalDiscountAmount = discountAmount || 0;
    let appliedCouponId: number | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.status === "ACTIVE") {
        const now = new Date();
        const isDateValid = (!coupon.startDate || coupon.startDate <= now) &&
                            (!coupon.endDate || coupon.endDate >= now);
        const isUsageValid = (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);

        if (isDateValid && isUsageValid) {
          let calculatedDiscount = 0;
          if (coupon.type === "FIXED") {
            calculatedDiscount = Math.min(coupon.value, totalPrice);
          } else {
            calculatedDiscount = Math.floor(totalPrice * coupon.value / 100);
            if (coupon.maxDiscount) {
              calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
            }
          }

          if (!coupon.minPurchase || totalPrice >= coupon.minPurchase) {
            finalDiscountAmount = calculatedDiscount;
            appliedCouponId = coupon.id;
            appliedCouponCode = coupon.code;

            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });

            await prisma.couponUsage.create({
              data: {
                couponId: coupon.id,
                orderId: 0,
                userId: userId,
                discount: finalDiscountAmount,
              },
            });
          }
        }
      }
    }

    const finalTotalPrice = totalPrice - finalDiscountAmount + (shippingPrice || 0);

    const currentYear = new Date().getFullYear();
    const lastOrder = await prisma.order.findFirst({
      orderBy: { id: "desc" },
    });
    const nextNumber = (lastOrder?.id ?? 0) + 1;
    const trackingNumber = `VS-${currentYear}-${String(nextNumber).padStart(6, "0")}`;

    const order = await prisma.order.create({
      data: {
        trackingNumber,
        userId,
        userName: userName,
        userEmail: userEmail,
        address,
        phone,
        customerNote: customerNote?.trim() || null,
        adminNote: adminNote?.trim() || null,
        totalPrice: finalTotalPrice,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        discountAmount: finalDiscountAmount,
        // ✅ فیلدهای جدید
        shippingMethodId: shippingMethodId || null,
        paymentMethodId: paymentMethodId || null,
        shippingPrice: shippingPrice || 0,
        items: {
          create: items.map((item: { productId: number; quantity: number }) => {
            const product = products.find((p: Product) => p.id === item.productId)!;
            return {
              productId: product.id,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // آپدیت couponUsage با orderId واقعی
    if (appliedCouponId) {
      await prisma.couponUsage.updateMany({
        where: {
          couponId: appliedCouponId,
          orderId: 0,
          userId: userId,
        },
        data: {
          orderId: order.id,
        },
      });
    }

    // کاهش موجودی محصولات
    await Promise.all(
      items.map(async (item: { productId: number; quantity: number }) => {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      })
    );

    // حذف سبد خرید کاربر بعد از ثبت سفارش
    await prisma.cart.delete({
      where: { userId: userId },
    }).catch(() => {});

    // ==================== ارسال پیامک ====================
    if (phone) {
      try {
        await sendOrderConfirmationSMS(phone, order.id, finalTotalPrice);
      } catch (smsError) {
        console.error("SMS sending error (order confirmation):", smsError);
      }
    }

    try {
      await sendAdminNotificationSMS(order.id, finalTotalPrice, userName);
    } catch (smsError) {
      console.error("SMS sending error (admin notification):", smsError);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Create Order Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}