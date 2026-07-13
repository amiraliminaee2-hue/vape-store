import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type OrderStatus = "REGISTERED" | "PAYED" | "ERROR" | "PROCESSING" | "SHIPPING" | "SHIPPED" | "CANCELLED";

interface OrderWhereInput {
  userId: string;
  status?: OrderStatus;
}

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

    const prisma = await getPrisma();

    const where: OrderWhereInput = {
      userId: session.user.id,
    };

    if (statusParam) {
      const validStatuses: OrderStatus[] = ["REGISTERED", "PAYED", "ERROR", "PROCESSING", "SHIPPING", "SHIPPED", "CANCELLED"];
      if (validStatuses.includes(statusParam as OrderStatus)) {
        where.status = statusParam as OrderStatus;
      }
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

    const prisma = await getPrisma();

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
        customerNote: orderData.customerNote ?? null,
        adminNote: orderData.adminNote ?? null,
        shippingMethodId: orderData.shippingMethodId ?? null,
        paymentMethodId: orderData.paymentMethodId ?? null,
        shippingPrice: orderData.shippingPrice || 0,
        items: {
          create: orderData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: 0,
          })),
        },
        userName: session.user.phone || "کاربر",
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