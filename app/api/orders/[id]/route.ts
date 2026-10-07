// app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";
import { sendOrderStatusSMS } from "@/lib/sms";

// =========================================================
// Schema validation
// =========================================================

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id باید عدد باشد"),
});

const patchBodySchema = z.object({
  status: z.enum([
    "REGISTERED",
    "PAYED",
    "PROCESSING",
    "SHIPPING",
    "SHIPPED",
    "CANCELLED",
    "ERROR",
  ]),
});

// =========================================================
// Types
// =========================================================

type RouteContext = {
  params: Promise<{ id: string }>;
};

// =========================================================
// Helper - validate order ID
// =========================================================

async function getValidatedOrderId(
  params: Promise<{ id: string }>
): Promise<
  | { success: true; id: number }
  | { success: false; response: NextResponse }
> {
  const { id } = await params;

  const validationResult = paramsSchema.safeParse({ id });

  if (!validationResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "پارامتر نامعتبر",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const orderId = Number(validationResult.data.id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "شناسه سفارش نامعتبر است",
        },
        {
          status: 400,
        }
      ),
    };
  }

  return {
    success: true,
    id: orderId,
  };
}

// =========================================================
// GET - دریافت سفارش توسط کاربر خودش
// =========================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
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

    const validatedId = await getValidatedOrderId(params);

    if (!validatedId.success) {
      return validatedId.response;
    }

    const prisma = await getPrisma();

    const order = await prisma.order.findFirst({
      where: {
        id: validatedId.id,
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
        {
          error: "سفارشی یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);

    return NextResponse.json(
      {
        error: "خطا در دریافت سفارش",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================================
// Update Order Status
// =========================================================

async function updateOrderStatus(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    // =======================================================
    // Session
    // =======================================================

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

    // =======================================================
    // Admin Access
    // =======================================================

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

    // =======================================================
    // Validate Order ID
    // =======================================================

    const validatedId = await getValidatedOrderId(params);

    if (!validatedId.success) {
      return validatedId.response;
    }

    const orderId = validatedId.id;

    // =======================================================
    // Validate Body
    // =======================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "بدنه درخواست نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const bodyValidationResult =
      patchBodySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error:
            "ورودی نامعتبر. وضعیت باید یکی از مقادیر REGISTERED, PAYED, PROCESSING, SHIPPING, SHIPPED, CANCELLED, ERROR باشد",
        },
        {
          status: 400,
        }
      );
    }

    const { status } = bodyValidationResult.data;

    const prisma = await getPrisma();

    // =======================================================
    // دریافت وضعیت فعلی سفارش
    // =======================================================

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          status: true,
          phone: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "سفارشی یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    // =======================================================
    // اگر وضعیت تغییری نکرده، Update و SMS انجام نده
    // =======================================================

    if (existingOrder.status === status) {
      return NextResponse.json({
        id: existingOrder.id,
        status: existingOrder.status,
      });
    }

    // =======================================================
    // Update Order
    // =======================================================

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    // =======================================================
    // ارسال پیامک تغییر وضعیت
    // فقط زمانی که وضعیت واقعاً تغییر کرده باشد
    // =======================================================

    if (existingOrder.phone) {
      try {
        await sendOrderStatusSMS(
          existingOrder.phone,
          order.id,
          status
        );
      } catch (smsError) {
        console.error(
          "SMS sending error (status change):",
          smsError
        );

        // خطای SMS نباید باعث شکست Update سفارش شود
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

// =========================================================
// POST - سازگاری با API فعلی پنل مدیریت
// =========================================================

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  return updateOrderStatus(request, params);
}

// =========================================================
// PATCH - متد استاندارد برای تغییر وضعیت
// =========================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  return updateOrderStatus(request, params);
}