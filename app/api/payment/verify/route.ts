import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { verifyPayment } from "@/lib/dargaah";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authority = searchParams.get("Authority");
  const orderIdParam = searchParams.get("orderId");
  const amountParam = searchParams.get("amount"); // ✅ دریافت amount از query string
  const status = searchParams.get("Status");

  console.log("Verify endpoint called with:", { authority, orderIdParam, amountParam, status });

  const resultPageUrl = `${process.env.NEXTAUTH_URL}/payment/result`;

  if (!orderIdParam || !authority || !amountParam) {
    console.error("Missing parameters:", { orderIdParam, authority, amountParam });
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

  if (status !== "OK") {
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