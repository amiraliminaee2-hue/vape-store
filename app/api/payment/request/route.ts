// app/api/payment/request/route.ts
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

    console.log("NEXTAUTH_URL =", process.env.NEXTAUTH_URL);
    console.log("VERCEL_URL =", process.env.VERCEL_URL);

    const baseUrl = "https://padbusher.ir";
    const callbackUrl = `${baseUrl}/api/payment/verify?orderId=${orderId}`;
    console.log("Generated callback =", callbackUrl);

    try {
      const { redirectUrl } = await createPaymentRequest(
        amount,
        orderId,
        callbackUrl,
        mobile
      );
      console.log("========================================");
      console.log("Callback URL:", callbackUrl);
      console.log("Redirect URL:", redirectUrl);
      console.log("========================================");

      return NextResponse.json({ paymentUrl: redirectUrl });
    } catch (paymentError) {
      console.error("❌ Payment create error:", paymentError);
      
      // اگر خطا از سمت ایران درگاه باشه، یه پیام مناسب برگردون
      return NextResponse.json(
        { 
          error: "درگاه پرداخت در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید.",
          details: paymentError instanceof Error ? paymentError.message : String(paymentError)
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("❌ Payment request error:", error);
    return NextResponse.json(
      { 
        error: "خطا در اتصال به درگاه پرداخت",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}