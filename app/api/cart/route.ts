import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cartItemSchema } from "@/lib/validations/schemas";

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
      (item) => ({
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

    const userId = session.user.id;
    const body = await request.json();

    // Zod validation
    const validationResult = cartItemSchema.safeParse(body);
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

    const existing =
      await prisma.cartItem.findUnique({
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
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "خطا در افزودن محصول",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE() {
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

    const userId = session.user.id;

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
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "خطا در پاکسازی سبد",
      },
      {
        status: 500,
      }
    );
  }
}