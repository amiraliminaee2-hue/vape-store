// app/api/cart/[productId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation for body
const bodySchema = z.object({
  action: z.enum(["increase", "decrease", "delete", "remove"]),
  // quantity: z.number().optional(), // ❌ حذف شد چون استفاده نمی‌شود
});

// Schema validation for params
const paramsSchema = z.object({
  productId: z.string().regex(/^\d+$/, "productId باید عدد باشد"),
});

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      productId: string;
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

    const prisma = await getPrisma();
    const userId = session.user.id;
    const { productId } = await params;

    // Validate params with Zod
    const paramsValidationResult = paramsSchema.safeParse({ productId });
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
    const bodyValidationResult = bodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر. action باید increase, decrease, یا delete باشد",
          details: bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { action } = bodyValidationResult.data; // ✅ فقط action استخراج می‌شود

    // پیدا کردن سبد کاربر
    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    if (!cart) {
      return NextResponse.json(
        {
          error: "سبد خرید یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    // پیدا کردن آیتم سبد
    const item = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
    });

    // ============================================
    // 1️⃣ افزایش تعداد (increase)
    // ============================================
    if (action === "increase") {
      if (!item) {
        return NextResponse.json(
          {
            error: "آیتم یافت نشد",
          },
          {
            status: 404,
          }
        );
      }

      await prisma.cartItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "تعداد با موفقیت افزایش یافت",
      });
    }

    // ============================================
    // 2️⃣ کاهش تعداد (decrease)
    // ============================================
    if (action === "decrease") {
      if (!item) {
        return NextResponse.json(
          {
            error: "آیتم یافت نشد",
          },
          {
            status: 404,
          }
        );
      }

      if (item.quantity <= 1) {
        // اگر تعداد ۱ یا کمتر بود، آیتم را حذف کن
        await prisma.cartItem.delete({
          where: {
            id: item.id,
          },
        });
        return NextResponse.json({
          success: true,
          message: "آیتم از سبد خرید حذف شد",
          removed: true,
        });
      } else {
        // کاهش تعداد
        await prisma.cartItem.update({
          where: {
            id: item.id,
          },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });
        return NextResponse.json({
          success: true,
          message: "تعداد با موفقیت کاهش یافت",
        });
      }
    }

    // ============================================
    // 3️⃣ حذف آیتم (delete/remove)
    // ============================================
    if (action === "delete" || action === "remove") {
      if (!item) {
        return NextResponse.json({
          success: true,
          message: "آیتم قبلاً حذف شده است",
        });
      }

      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: Number(productId),
        },
      });

      return NextResponse.json({
        success: true,
        message: "آیتم با موفقیت حذف شد",
      });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      {
        error: "اکشن نامعتبر. گزینه‌های مجاز: increase, decrease, delete, remove",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("Cart operation error:", error);
    return NextResponse.json(
      {
        error: "خطا در بروزرسانی سبد خرید",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}