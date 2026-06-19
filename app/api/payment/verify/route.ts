import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/dargaah";

// ایران درگاه اطلاعات بازگشتی رو به صورت POST میفرسته
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const resultPageUrl = `${process.env.NEXTAUTH_URL}/payment/result`;

  // orderId و amount از query string میان (که موقع ساخت callbackURL گذاشتیم)
  const searchParams = request.nextUrl.searchParams;
  const orderIdParam = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");

  // authority و code از POST body میان
  const formData = await request.formData();
  const authority = formData.get("authority") as string;
  const code = formData.get("code") as string;

  console.log("Verify called:", { authority, code, orderIdParam, amountParam });

  if (!orderIdParam || !authority || !amountParam) {
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&error=اطلاعات پرداخت ناقص است`
    );
  }

  const orderId = parseInt(orderIdParam, 10);
  const amount = parseInt(amountParam, 10);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&error=سفارش یافت نشد`
    );
  }

  if (order.status === "PAYED") {
    return NextResponse.redirect(
      `${resultPageUrl}?status=success&orderId=${orderId}&message=پرداخت قبلاً انجام شده است`
    );
  }

  // code === "-1" یعنی کاربر انصراف داده
  if (code !== "200" && code !== "201") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&orderId=${orderId}&error=پرداخت توسط کاربر لغو شد`
    );
  }

  try {
    const verificationResult = await verifyPayment(orderId, authority, amount);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAYED",
        transactionId: verificationResult.refId,
        adminNote: `شماره تراکنش: ${verificationResult.refId}`,
      },
    });

    return NextResponse.redirect(
      `${resultPageUrl}?status=success&orderId=${orderId}&refId=${verificationResult.refId}`
    );
  } catch (error) {
    console.error("Verification failed:", error);
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ERROR" },
    });
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&orderId=${orderId}&error=خطا در تأیید پرداخت`
    );
  }
}