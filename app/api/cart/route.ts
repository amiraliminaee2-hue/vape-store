// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { cartItemSchema } from "@/lib/validations/schemas";

interface CartItemWithProduct {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: number;
    discountPercent: number;
    category: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export async function GET() {
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

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json([]);
    }

    const items = cart.items.map(
      (item: CartItemWithProduct) => ({
        id: item.id,
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        discountPercent: item.product.discountPercent || 0,
        quantity: item.quantity,
      })
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "خطا در دریافت سبد",
      },
      {
        status: 500,
      }
    );
  }
}

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(request: Request) {
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
    const body = await request.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ افزودن محصول به سبد (ADD)
    // ============================================
    if (action === "add") {
      // Zod validation
      const validationResult = cartItemSchema.safeParse(data);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "ورودی نامعتبر",
            details: validationResult.error.issues,
          },
          {
            status: 400,
          }
        );
      }

      const { productId, quantity = 1 } = validationResult.data;

      let cart = await prisma.cart.findUnique({
        where: {
          userId,
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId,
          },
        });
      }

      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: {
            id: existing.id,
          },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "محصول به سبد خرید اضافه شد",
      });
    }

    // ============================================
    // 2️⃣ پاکسازی کامل سبد (CLEAR)
    // ============================================
    if (action === "clear") {
      const cart = await prisma.cart.findUnique({
        where: {
          userId,
        },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "سبد خرید با موفقیت پاکسازی شد",
      });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      {
        error: "اکشن نامعتبر. گزینه‌های مجاز: add, clear",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "خطا در عملیات سبد خرید",
      },
      {
        status: 500,
      }
    );
  }
}