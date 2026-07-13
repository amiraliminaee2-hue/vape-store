// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/dargaah";

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const resultPageUrl = `${process.env.NEXTAUTH_URL}/payment/result`;

  const searchParams = request.nextUrl.searchParams;
  const orderIdParam = searchParams.get("orderId");
  const authority = searchParams.get("authority");
  const status = searchParams.get("status");

  console.log("Verify callback:", {
    authority,
    status,
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

  if (order.status === "PAYED") {
    return NextResponse.redirect(
      `${resultPageUrl}?status=success&orderId=${order.id}&message=پرداخت قبلاً انجام شده است`
    );
  }

  if (status !== "OK") {
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