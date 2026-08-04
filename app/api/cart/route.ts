// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
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

    const items = cart.items.map((item) => {
      const product = item.product;
      const basePrice = product.price;
      const discountPercent = product.discountPercent || 0;
      const discountedPrice = discountPercent > 0
        ? basePrice - (basePrice * discountPercent / 100)
        : basePrice;

      let flavorTotalPrice = 0;
      const flavorDetails = item.flavors.map((flavorItem) => {
        const flavorPrice = flavorItem.price;
        flavorTotalPrice += flavorPrice * flavorItem.quantity;
        return {
          flavorId: flavorItem.flavorId,
          name: flavorItem.flavor.name,
          quantity: flavorItem.quantity,
          price: flavorPrice,
        };
      });

      const itemQuantity = item.quantity || 1;
      const totalPrice = (discountedPrice * itemQuantity) + flavorTotalPrice;

      return {
        id: item.id,
        productId: product.id,
        title: product.title,
        price: product.price,
        discountPercent: discountPercent,
        quantity: itemQuantity,
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

      // بررسی وجود محصول
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          {
            error: "محصول یافت نشد",
          },
          {
            status: 404,
          }
        );
      }

      // بررسی موجودی محصول
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `موجودی محصول ${product.title} کافی نیست`,
          },
          {
            status: 400,
          }
        );
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
        // بررسی موجودی طعم با احتساب مقدار فعلی در سبد
        const currentCart = await prisma.cart.findUnique({
          where: { userId },
          include: {
            items: {
              where: { productId },
              include: {
                flavors: {
                  where: { flavorId },
                },
              },
            },
          },
        });

        let currentFlavorQuantity = 0;
        if (currentCart) {
          for (const item of currentCart.items) {
            for (const flavorItem of item.flavors) {
              currentFlavorQuantity += flavorItem.quantity;
            }
          }
        }

        const totalFlavorQuantity = currentFlavorQuantity + quantity;
        if (flavor.stock < totalFlavorQuantity) {
          return NextResponse.json(
            {
              error: `موجودی طعم ${flavor.name} کافی نیست (موجودی: ${flavor.stock}، درخواستی: ${totalFlavorQuantity})`,
            },
            {
              status: 400,
            }
          );
        }
      }

      // استفاده از Transaction برای جلوگیری از ناسازگاری داده‌ها
      const result = await prisma.$transaction(async (tx) => {
        // پیدا کردن یا ایجاد سبد خرید
        let cart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: { userId },
          });
        }

        // پیدا کردن یا ایجاد آیتم سبد
        let cartItem = await tx.cartItem.findUnique({
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
          cartItem = await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity: 0,
            },
          });
        }

        // اضافه کردن یا بروزرسانی طعم
        if (flavorId) {
          const existingFlavor = await tx.cartItemFlavor.findUnique({
            where: {
              cartItemId_flavorId: {
                cartItemId: cartItem.id,
                flavorId,
              },
            },
          });

          const flavorPrice = flavor?.price || 0;

          if (existingFlavor) {
            await tx.cartItemFlavor.update({
              where: { id: existingFlavor.id },
              data: { quantity: { increment: quantity } },
            });
          } else {
            await tx.cartItemFlavor.create({
              data: {
                cartItemId: cartItem.id,
                flavorId,
                quantity,
                price: flavorPrice,
              },
            });
          }
        }

        // بروزرسانی تعداد کل آیتم
        const updatedCartItem = await tx.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: { increment: quantity } },
        });

        return updatedCartItem;
      });

      return NextResponse.json({
        success: true,
        message: "محصول به سبد خرید اضافه شد",
        cartItem: result,
      });
    }

    if (action === "clear") {
      // استفاده از Transaction برای پاکسازی امن سبد
      await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: {
              include: {
                flavors: true,
              },
            },
          },
        });

        if (cart) {
          // حذف تمام طعم‌های آیتم‌های سبد
          for (const item of cart.items) {
            await tx.cartItemFlavor.deleteMany({
              where: {
                cartItemId: item.id,
              },
            });
          }

          // حذف تمام آیتم‌های سبد
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
            },
          });

          // حذف خود سبد
          await tx.cart.delete({
            where: {
              id: cart.id,
            },
          });
        }
      });

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