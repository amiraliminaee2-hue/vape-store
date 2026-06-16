import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendOrderStatusSMS } from "@/lib/sms";
import { isAdmin } from "@/lib/isAdmin";

// Schema validation for params
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id باید عدد باشد"),
});

// Schema validation for PATCH request body
const patchBodySchema = z.object({
  status: z.enum(["REGISTERED", "PAYED", "PROCESSING", "SHIPPING", "SHIPPED", "CANCELLED", "ERROR"]),
});

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // Check if user is admin
    const adminAccess = await isAdmin(session.user.id);
    if (!adminAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    // Validate params with Zod
    const paramsValidationResult = paramsSchema.safeParse({ id });
    if (!paramsValidationResult.success) {
      return NextResponse.json(
        {
          error: "پارامتر نامعتبر",
          details: paramsValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    // Validate body with Zod
    const bodyValidationResult = patchBodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر. وضعیت باید یکی از مقادیر REGISTERED, PAYED, PROCESSING, SHIPPING, SHIPPED, CANCELLED, ERROR باشد",
          details: bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { status } = bodyValidationResult.data;

    // ابتدا سفارش را دریافت کنیم تا شماره تلفن را داشته باشیم
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
      select: { phone: true, id: true },
    });

    const order = await prisma.order.update({
      where: {
        id: Number(id),
      },
      data: {
        status: status as OrderStatus,
      },
    });

    // ==================== ارسال پیامک تغییر وضعیت ====================
    if (existingOrder?.phone) {
      try {
        await sendOrderStatusSMS(existingOrder.phone, order.id, status);
      } catch (smsError) {
        console.error("SMS sending error (status change):", smsError);
        // خطای پیامک نباید باعث شکست عملیات شود
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Update Order Error:", error);

    return NextResponse.json(
      {
        error: "خطا در بروزرسانی سفارش",
      },
      {
        status: 500,
      }
    );
  }
}