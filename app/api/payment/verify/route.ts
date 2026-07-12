import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/dargaah";

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const resultPageUrl = `${process.env.NEXTAUTH_URL}/payment/result`;

  // فقط orderId از callback می‌آید
  const searchParams = request.nextUrl.searchParams;
  const orderIdParam = searchParams.get("orderId");

  // اطلاعات ارسالی از ایران‌درگاه
  const formData = await request.formData();
  const authority = formData.get("authority") as string;
  const code = formData.get("code") as string;

  console.log("Verify callback:", {
    authority,
    code,
    orderId: orderIdParam,
  });

  if (!orderIdParam || !authority) {
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&error=اطلاعات پرداخت ناقص است`
    );
  }

  const orderId = Number(orderIdParam);

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&error=سفارش یافت نشد`
    );
  }

  // اگر قبلاً پرداخت شده باشد
  if (order.status === "PAYED") {
    return NextResponse.redirect(
      `${resultPageUrl}?status=success&orderId=${order.id}&message=پرداخت قبلاً انجام شده است`
    );
  }

  // انصراف یا خطای اولیه
  if (code !== "200" && code !== "201") {
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&orderId=${order.id}&error=پرداخت توسط کاربر لغو شد`
    );
  }

  // مبلغ واقعی سفارش از دیتابیس (تومان → ریال)
  const amountInRial = Number(order.totalPrice) * 10;

  try {
    const verification = await verifyPayment(
      order.id,
      authority,
      amountInRial
    );

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PAYED",
        transactionId: verification.refId,
        adminNote: `شماره تراکنش: ${verification.refId}`,
      },
    });

    return NextResponse.redirect(
      `${resultPageUrl}?status=success&orderId=${order.id}&refId=${verification.refId}`
    );
  } catch (error) {
    console.error("Verification error:", error);

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "ERROR",
      },
    });

    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&orderId=${order.id}&error=خطا در تأیید پرداخت`
    );
  }
}