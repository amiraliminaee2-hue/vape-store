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

interface CartItemWithFlavors {
  id: number;
  quantity: number;
  productId: number;
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
  flavors: Array<{
    id: number;
    flavorId: number;
    quantity: number;
    price: number;
    flavor: {
      id: number;
      name: string;
      price: number | null;
    };
  }>;
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
            flavors: {
              include: {
                flavor: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json([]);
    }

    const items = cart.items.map((item: CartItemWithFlavors) => {
      const basePrice = item.product.price;
      const discountPercent = item.product.discountPercent || 0;
      const discountedPrice = discountPercent > 0
        ? basePrice - (basePrice * discountPercent / 100)
        : basePrice;

      let flavorTotalPrice = 0;
      const flavorDetails = item.flavors.map((flavorItem) => {
        const flavorPrice = flavorItem.flavor.price || 0;
        flavorTotalPrice += flavorPrice * flavorItem.quantity;
        return {
          flavorId: flavorItem.flavorId,
          name: flavorItem.flavor.name,
          quantity: flavorItem.quantity,
          price: flavorPrice,
        };
      });

      const totalPrice = (discountedPrice + (flavorTotalPrice / item.quantity)) * item.quantity;

      return {
        id: item.id,
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        discountPercent: discountPercent,
        quantity: item.quantity,
        flavors: flavorDetails,
        totalPrice: totalPrice,
      };
    });

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

    const prisma = await getPrisma();
    const userId = session.user.id;
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "add") {
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

      const { productId, quantity = 1, flavorId } = validationResult.data;

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

      let flavor = null;
      if (flavorId) {
        flavor = await prisma.flavor.findUnique({
          where: { id: flavorId },
        });
        if (!flavor) {
          return NextResponse.json(
            {
              error: "طعم انتخاب شده یافت نشد",
            },
            {
              status: 404,
            }
          );
        }
        if (flavor.stock < quantity) {
          return NextResponse.json(
            {
              error: `موجودی طعم ${flavor.name} کافی نیست`,
            },
            {
              status: 400,
            }
          );
        }
      }

      let cartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: {
          flavors: true,
        },
      });

      if (!cartItem) {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: 0,
          },
        });
      }

      if (flavorId) {
        const existingFlavor = await prisma.cartItemFlavor.findUnique({
          where: {
            cartItemId_flavorId: {
              cartItemId: cartItem.id,
              flavorId,
            },
          },
        });

        if (existingFlavor) {
          await prisma.cartItemFlavor.update({
            where: { id: existingFlavor.id },
            data: { quantity: { increment: quantity } },
          });
        } else {
          await prisma.cartItemFlavor.create({
            data: {
              cartItemId: cartItem.id,
              flavorId,
              quantity,
              price: flavor?.price || 0,
            },
          });
        }
      }

      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: { increment: quantity } },
      });

      return NextResponse.json({
        success: true,
        message: "محصول به سبد خرید اضافه شد",
      });
    }

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