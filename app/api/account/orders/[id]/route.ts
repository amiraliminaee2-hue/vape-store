import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  console.log("========== ORDER DETAIL API ==========");
  console.log("params =", await params);
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const prisma = await getPrisma();

    const order = await prisma.order.findFirst({
      where: {
        id: Number(id),
        userId: session.user.id,
      },
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
    });

    if (!order) {
      return NextResponse.json(
        { error: "سفارشی یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order detail error:", error);

    return NextResponse.json(
      {
        error: "خطا در دریافت جزئیات سفارش",
      },
      {
        status: 500,
      }
    );
  }
}