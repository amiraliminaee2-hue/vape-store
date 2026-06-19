import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { createPaymentRequest } from "@/lib/dargaah";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "لطفاً وارد حساب کاربری شوید" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const { orderId, amount, mobile } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId و amount الزامی است" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    // orderId و amount رو در callbackURL نگه میداریم چون POST body جداست
    const callbackUrl = `${baseUrl}/api/payment/verify?orderId=${orderId}&amount=${amount}`;

    const { redirectUrl } = await createPaymentRequest(amount, orderId, callbackUrl, mobile);

    return NextResponse.json({ paymentUrl: redirectUrl });
  } catch (error) {
    console.error("❌ Payment request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در اتصال به درگاه پرداخت" },
      { status: 500 }
    );
  }
}