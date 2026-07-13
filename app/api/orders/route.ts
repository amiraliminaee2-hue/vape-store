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

interface OrderCreateInput {
  userId: string;
  trackingNumber: string;
  userName: string;
  address: string;
  phone: string;
  totalPrice: number;
  status: "REGISTERED";
  customerNote?: string;
  adminNote?: string;
  couponId?: number | null;
  couponCode?: string | null;
  discountAmount?: number;
  shippingMethodId?: number | null;
  paymentMethodId?: number | null;
  shippingPrice?: number;
  items: {
    create: {
      productId: number;
      quantity: number;
      price: number;
    }[];
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Orders API called");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const body = await request.json();

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

    const orderCreateData: OrderCreateInput = {
      userId: userId,
      trackingNumber: trackingNumber,
      userName: userName,
      address: address,
      phone: phone,
      totalPrice: finalTotal,
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
    };

    if (customerNote) orderCreateData.customerNote = customerNote;
    if (adminNote) orderCreateData.adminNote = adminNote;
    if (appliedCouponId) orderCreateData.couponId = appliedCouponId;
    if (appliedCouponCode) orderCreateData.couponCode = appliedCouponCode;
    if (finalDiscount > 0) orderCreateData.discountAmount = finalDiscount;
    if (shippingMethodId) orderCreateData.shippingMethodId = shippingMethodId;
    if (paymentMethodId) orderCreateData.paymentMethodId = paymentMethodId;
    if (shippingPrice) orderCreateData.shippingPrice = shippingPrice;

    console.log("📤 Final order data:", JSON.stringify(orderCreateData, null, 2));

    const order = await prisma.order.create({
      data: orderCreateData,
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