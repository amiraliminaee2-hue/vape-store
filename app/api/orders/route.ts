// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

interface OrderItemInput {
  productId: number;
  quantity: number;
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

    const session = await getServerSession(authOptions);
    console.log("📋 Session:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری شوید" },
        { status: 401 }
      );
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    const body = await request.json();
    console.log("📦 Body received:", JSON.stringify(body, null, 2));

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

    if (!address) {
      return NextResponse.json({ error: "آدرس الزامی است" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "شماره تلفن الزامی است" }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "سبد خرید خالی است" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const userName = user?.phone || "کاربر";

    let totalPrice = 0;
    const productIds = items.map((item: OrderItemInput) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    }) as Product[];

    for (const item of items) {
      const product = products.find((p: Product) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `محصول با شناسه ${item.productId} یافت نشد` },
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

    const finalDiscount = discountAmount || 0;
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
          if (!coupon.minPurchase || totalPrice >= coupon.minPurchase) {
            appliedCouponId = coupon.id;
            appliedCouponCode = coupon.code;
          }
        }
      }
    }

    const finalTotal = totalPrice - finalDiscount + (shippingPrice || 0);
    const trackingNumber = `VS-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        userId,
        trackingNumber,
        userName,
        address,
        phone,
        customerNote: customerNote || null,
        adminNote: adminNote || null,
        totalPrice: finalTotal,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        discountAmount: finalDiscount,
        shippingMethodId: shippingMethodId || null,
        paymentMethodId: paymentMethodId || null,
        shippingPrice: shippingPrice || 0,
        status: "REGISTERED",
        items: {
          create: items.map((item: OrderItemInput) => {
            const product = products.find((p: Product) => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product ? product.price : 0,
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

    console.log("✅ Order created:", order.id);

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.cart.delete({
      where: { userId },
    }).catch(() => {});

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    return NextResponse.json(
      { 
        error: "خطا در ثبت سفارش",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}