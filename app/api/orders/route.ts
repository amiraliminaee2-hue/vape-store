// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

interface OrderItemInput {
  productId: number;
  quantity: number;
  flavorId?: number | null;
}

interface Product {
  id: number;
  title: string;
  stock: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Orders API called");

    // ==========================================
    // دریافت Session
    // ==========================================

    const session = await getServerSession(authOptions);

    console.log("📋 Session:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "ابتدا وارد حساب کاربری شوید",
        },
        {
          status: 401,
        }
      );
    }

    const prisma = await getPrisma();

    const userId = session.user.id;

    // ==========================================
    // بررسی وجود واقعی User در دیتابیس
    // ==========================================

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    });

    if (!user) {
      console.error(
        "❌ Session user does not exist in database:",
        userId
      );

      return NextResponse.json(
        {
          error:
            "حساب کاربری شما معتبر نیست. لطفاً از حساب خارج شوید و دوباره وارد شوید.",
          code: "USER_NOT_FOUND",
        },
        {
          status: 401,
        }
      );
    }

    console.log("✅ User verified:", {
      id: user.id,
      phone: user.phone,
      name: user.name,
    });

    const body = await request.json();

    console.log(
      "📦 Body received:",
      JSON.stringify(body, null, 2)
    );

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
    } = body;

    // ==========================================
    // اعتبارسنجی اطلاعات سفارش
    // ==========================================

    if (!address) {
      return NextResponse.json(
        {
          error: "آدرس الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "شماره تلفن الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "سبد خرید خالی است",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // اعتبارسنجی آیتم‌های سفارش
    // ==========================================

    for (const item of items as OrderItemInput[]) {
      if (!item.productId) {
        return NextResponse.json(
          {
            error: "شناسه محصول نامعتبر است",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error: `تعداد محصول ${item.productId} نامعتبر است`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // ==========================================
    // محاسبه قیمت محصولات
    // ==========================================

    let totalPrice = 0;

    const productIds = (
      items as OrderItemInput[]
    ).map(
      (item) => item.productId
    );

    const products = (await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })) as Product[];

    for (const item of items as OrderItemInput[]) {
      const product = products.find(
        (p: Product) =>
          p.id === item.productId
      );

      if (!product) {
        return NextResponse.json(
          {
            error: `محصول با شناسه ${item.productId} یافت نشد`,
          },
          {
            status: 404,
          }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `موجودی ${product.title} کافی نیست`,
          },
          {
            status: 400,
          }
        );
      }

      totalPrice +=
        product.price * item.quantity;
    }

    // ==========================================
    // بررسی کوپن
    // ==========================================

    const finalDiscount =
      Number(discountAmount) || 0;

    let appliedCouponId: number | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const coupon =
        await prisma.coupon.findUnique({
          where: {
            code: String(
              couponCode
            ).toUpperCase(),
          },
        });

      if (
        coupon &&
        coupon.status === "ACTIVE"
      ) {
        const now = new Date();

        const isDateValid =
          (!coupon.startDate ||
            coupon.startDate <= now) &&
          (!coupon.endDate ||
            coupon.endDate >= now);

        const isUsageValid =
          !coupon.usageLimit ||
          coupon.usedCount <
            coupon.usageLimit;

        if (
          isDateValid &&
          isUsageValid
        ) {
          if (
            !coupon.minPurchase ||
            totalPrice >=
              coupon.minPurchase
          ) {
            appliedCouponId =
              coupon.id;

            appliedCouponCode =
              coupon.code;
          }
        }
      }
    }

    // ==========================================
    // محاسبه مبلغ نهایی
    // ==========================================

    const finalShippingPrice =
      Number(shippingPrice) || 0;

    const finalTotal =
      totalPrice -
      finalDiscount +
      finalShippingPrice;

    if (finalTotal < 0) {
      return NextResponse.json(
        {
          error:
            "مبلغ نهایی سفارش نمی‌تواند منفی باشد",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // ایجاد شماره پیگیری
    // ==========================================

    const trackingNumber =
      `VS-${Date.now()}`;

    // ==========================================
    // ایجاد سفارش
    // ==========================================

    const order =
      await prisma.order.create({
        data: {
          userId,

          trackingNumber,

          userName:
            user.phone ||
            user.name ||
            "کاربر",

          address,

          phone,

          customerNote:
            customerNote || null,

          adminNote:
            adminNote || null,

          totalPrice:
            finalTotal,

          couponId:
            appliedCouponId,

          couponCode:
            appliedCouponCode,

          discountAmount:
            finalDiscount,

          shippingMethodId:
            shippingMethodId
              ? Number(
                  shippingMethodId
                )
              : null,

          paymentMethodId:
            paymentMethodId
              ? Number(
                  paymentMethodId
                )
              : null,

          shippingPrice:
            finalShippingPrice,

          status:
            "REGISTERED",

          items: {
            create: (
              items as OrderItemInput[]
            ).map(
              (
                item: OrderItemInput
              ) => {
                const product =
                  products.find(
                    (p: Product) =>
                      p.id ===
                      item.productId
                  );

                return {
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  price:
                    product
                      ? product.price
                      : 0,
                };
              }
            ),
          },
        },

        include: {
          items: {
            include: {
              product: true,

              flavors: {
                include: {
                  flavor: true,
                },
              },
            },
          },
        },
      });

    console.log(
      "✅ Order created:",
      order.id
    );

    // ==========================================
    // کاهش موجودی محصولات
    // ==========================================

    for (const item of items as OrderItemInput[]) {
      await prisma.product.update({
        where: {
          id: item.productId,
        },

        data: {
          stock: {
            decrement:
              item.quantity,
          },
        },
      });
    }

    // ==========================================
    // حذف سبد خرید
    // ==========================================

    await prisma.cart
      .delete({
        where: {
          userId,
        },
      })
      .catch(() => {
        // اگر سبد خرید وجود نداشت،
        // خطا نادیده گرفته می‌شود.
      });

    // ==========================================
    // پاسخ موفق
    // ==========================================

    return NextResponse.json(
      order,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "❌ Create Order Error:",
      error
    );

    return NextResponse.json(
      {
        error: "خطا در ثبت سفارش",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}