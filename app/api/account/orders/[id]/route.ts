import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// تعریف تایپ برای OrderStatus بر اساس مقادیر موجود در schema
type OrderStatus = "REGISTERED" | "PAYED" | "ERROR" | "PROCESSING" | "SHIPPING" | "SHIPPED" | "CANCELLED";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const statusParam = searchParams.get("status");
    const skip = (page - 1) * limit;

    // ✅ دریافت prisma از getPrisma
    const prisma = await getPrisma();

    // ✅ ساخت where با استفاده از Prisma.OrderWhereInput
    const where: Prisma.OrderWhereInput = {
      userId: session.user.id,
    };

    // ✅ اضافه کردن شرط status در صورت وجود
    if (statusParam && Object.values(["REGISTERED", "PAYED", "ERROR", "PROCESSING", "SHIPPING", "SHIPPED", "CANCELLED"]).includes(statusParam)) {
      where.status = statusParam as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingMethod: true,
          paymentMethod: true,
          coupon: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "خطا در دریافت سفارشات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // ✅ دریافت prisma از getPrisma
    const prisma = await getPrisma();

    // ✅ تایپ مناسب برای body
    const orderData: {
      address: string;
      phone: string;
      items: { productId: number; quantity: number }[];
      customerNote?: string;
      adminNote?: string;
      shippingMethodId?: number;
      paymentMethodId?: number;
      shippingPrice?: number;
    } = body;

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        address: orderData.address,
        phone: orderData.phone,
        customerNote: orderData.customerNote,
        adminNote: orderData.adminNote,
        shippingMethodId: orderData.shippingMethodId,
        paymentMethodId: orderData.paymentMethodId,
        shippingPrice: orderData.shippingPrice || 0,
        items: {
          create: orderData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: 0, // باید از محصول دریافت بشه
          })),
        },
        userName: session.user.name || "کاربر",
        userEmail: session.user.email || "",
        totalPrice: 0,
        trackingNumber: `ORD-${Date.now()}`,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "خطا در ایجاد سفارش" }, { status: 500 });
  }
}