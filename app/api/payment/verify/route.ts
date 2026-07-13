// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/dargaah";

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const searchParams = request.nextUrl.searchParams;
    
    // دریافت پارامترهای callback از ایران درگاه
    const authority = searchParams.get("authority");
    const statusCode = searchParams.get("status_code");
    const orderIdParam = searchParams.get("order_id") || searchParams.get("orderId");
    const refId = searchParams.get("ref_id");
    const amount = searchParams.get("amount");

    console.log("📥 Payment callback received:", {
      authority,
      statusCode,
      orderIdParam,
      refId,
      amount,
    });

    // اعتبارسنجی اولیه
    if (!authority || !orderIdParam) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/payment/result?status=failed&error=اطلاعات پرداخت ناقص است`
      );
    }

    const orderId = Number(orderIdParam);
    const resultPageUrl = `${process.env.NEXTAUTH_URL}/payment/result`;

    // پیدا کردن سفارش
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.redirect(
        `${resultPageUrl}?status=failed&error=سفارش یافت نشد`
      );
    }

    // اگر قبلاً پرداخت شده
    if (order.status === "PAYED") {
      return NextResponse.redirect(
        `${resultPageUrl}?status=success&orderId=${order.id}&message=پرداخت قبلاً انجام شده است`
      );
    }

    // بررسی وضعیت پرداخت از callback
    const statusCodeNum = Number(statusCode);
    
    // status_code: 201 = پرداخت موفق (منتظر تأیید), 100 = پرداخت موفق و تأیید شده
    // status_code: منفی = ناموفق
    if (statusCodeNum < 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.redirect(
        `${resultPageUrl}?status=failed&orderId=${order.id}&error=پرداخت ناموفق یا لغو شده`
      );
    }

    // اگر status_code 100 باشه (direct_verify=true) و refId داره
    if (statusCodeNum === 100 && refId) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAYED",
          transactionId: refId,
        },
      });

      return NextResponse.redirect(
        `${resultPageUrl}?status=success&orderId=${order.id}&refId=${refId}`
      );
    }

    // اگر status_code 201 باشه (منتظر تأیید)
    if (statusCodeNum === 201) {
      // تأیید پرداخت از طریق API
      try {
        const amountInRial = Number(order.totalPrice) * 10;
        
        const verification = await verifyPayment(
          order.id,
          authority,
          amountInRial
        );

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAYED",
            transactionId: verification.refId,
          },
        });

        return NextResponse.redirect(
          `${resultPageUrl}?status=success&orderId=${order.id}&refId=${verification.refId}`
        );
      } catch (error) {
        console.error("❌ Verification error:", error);

        await prisma.order.update({
          where: { id: order.id },
          data: { status: "ERROR" },
        });

        return NextResponse.redirect(
          `${resultPageUrl}?status=failed&orderId=${order.id}&error=خطا در تأیید پرداخت`
        );
      }
    }

    // وضعیت نامشخص
    return NextResponse.redirect(
      `${resultPageUrl}?status=failed&orderId=${order.id}&error=وضعیت پرداخت نامشخص است`
    );
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/payment/result?status=failed&error=خطا در پردازش پرداخت`
    );
  }
}