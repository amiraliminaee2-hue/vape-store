import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPaymentRequest } from "@/lib/dargaah";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "لطفاً وارد حساب کاربری شوید" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, description, mobile } = body;

    console.log("📡 Payment request received:", { orderId, amount, description, mobile });

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId و amount الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود سفارش
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
    });

    if (!order) {
      console.error("❌ Order not found:", orderId);
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }

    // ساخت callback URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/payment/verify?orderId=${orderId}&amount=${amount}`;
    
    console.log("🔗 Callback URL:", callbackUrl);

    // فراخوانی تابع createPaymentRequest
    const { redirectUrl } = await createPaymentRequest(amount, orderId, callbackUrl, mobile);

    console.log("✅ Payment URL created:", redirectUrl);

    return NextResponse.json({ paymentUrl: redirectUrl });
  } catch (error) {
    console.error("❌ Payment request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در اتصال به درگاه پرداخت" },
      { status: 500 }
    );
  }
}