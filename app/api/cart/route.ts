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
                flavors: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    name: "asc",
                  },
                },
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

      const discountedPrice =
        discountPercent > 0
          ? Math.round(
              basePrice - (basePrice * discountPercent) / 100
            )
          : basePrice;

      const flavorDetails = item.flavors.map((flavorItem) => {
  return {
    flavorId: flavorItem.flavorId,
    name: flavorItem.flavor.name,
    quantity: flavorItem.quantity,
    stock: flavorItem.flavor.stock,
    isActive: flavorItem.flavor.isActive,
  };
});

const itemQuantity = item.quantity || 1;

const totalPrice = discountedPrice * itemQuantity;

      /*
       * اگر محصول طعم داشته باشد،
       * موجودی قابل خرید برای هر طعم جداگانه است.
       *
       * در کنار آن Product.stock هم به عنوان سقف کلی
       * محصول در نظر گرفته می‌شود.
       */
      const hasFlavors = product.flavors.length > 0;

      const selectedFlavorStocks = item.flavors.map(
        (flavorItem) => flavorItem.flavor.stock
      );

      const minimumSelectedFlavorStock =
        selectedFlavorStocks.length > 0
          ? Math.min(...selectedFlavorStocks)
          : null;

      const availableStock = hasFlavors
        ? minimumSelectedFlavorStock !== null
          ? Math.min(product.stock, minimumSelectedFlavorStock)
          : product.stock
        : product.stock;

      return {
        id: item.id,
        productId: product.id,

        title: product.title,

        /*
         * قیمت اصلی محصول
         */
        price: product.price,

        /*
         * قیمت نهایی هر عدد بعد از تخفیف
         */
        discountedPrice,

        discountPercent,

        quantity: itemQuantity,

        /*
         * موجودی کلی محصول
         */
        stock: product.stock,

        /*
         * آیا محصول طعم دارد؟
         */
        hasFlavors,

        /*
         * طعم‌هایی که در سبد انتخاب شده‌اند
         */
        flavors: flavorDetails,

        /*
         * طعم‌های فعال موجود برای انتخاب
         */
        availableFlavors: product.flavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          stock: flavor.stock,
          isActive: flavor.isActive,
        })),

        /*
         * موجودی قابل استفاده برای این آیتم
         */
        availableStock,

        /*
         * قیمت کل این آیتم
         *
         * قیمت طعم در این محاسبه وجود ندارد.
         */
        totalPrice,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Cart GET error:", error);

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

    // =========================================================
    // ADD TO CART
    // =========================================================

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

      const {
        productId,
        quantity = 1,
        flavorId,
      } = validationResult.data;

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          {
            error: "تعداد محصول باید بیشتر از صفر باشد",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // دریافت محصول و طعم‌های فعال
      // -------------------------------------------------------

      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          flavors: {
            where: {
              isActive: true,
            },
          },
        },
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

      if (!product.isActive) {
        return NextResponse.json(
          {
            error: "این محصول در حال حاضر فعال نیست",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // بررسی اینکه محصول طعم دارد یا نه
      // -------------------------------------------------------

      const hasFlavors = product.flavors.length > 0;

      /*
       * اگر محصول طعم داشته باشد،
       * انتخاب طعم اجباری است.
       */
      if (hasFlavors && !flavorId) {
        return NextResponse.json(
          {
            error: "لطفاً طعم محصول را انتخاب کنید",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * اگر محصول طعم ندارد،
       * نباید flavorId ارسال شود.
       */
      if (!hasFlavors && flavorId) {
        return NextResponse.json(
          {
            error: "این محصول دارای طعم نیست",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // بررسی موجودی کلی محصول
      // -------------------------------------------------------

      if (product.stock <= 0) {
        return NextResponse.json(
          {
            error: `محصول ${product.title} ناموجود است`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * سبد فعلی کاربر را می‌گیریم تا بفهمیم
       * چند عدد از این محصول قبلاً داخل سبد است.
       */
      const currentCart = await prisma.cart.findUnique({
        where: {
          userId,
        },
        include: {
          items: {
            where: {
              productId,
            },
            include: {
              flavors: true,
            },
          },
        },
      });

      let currentProductQuantity = 0;

      if (currentCart) {
        for (const item of currentCart.items) {
          currentProductQuantity += item.quantity || 0;
        }
      }

      const requestedProductQuantity =
        currentProductQuantity + quantity;

      // -------------------------------------------------------
      // کنترل موجودی کلی محصول
      // -------------------------------------------------------

      if (requestedProductQuantity > product.stock) {
        return NextResponse.json(
          {
            error: `موجودی محصول ${product.title} کافی نیست`,
            availableStock: Math.max(
              product.stock - currentProductQuantity,
              0
            ),
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // کنترل موجودی طعم
      // -------------------------------------------------------

      let selectedFlavor = null;

      if (flavorId) {
        selectedFlavor = product.flavors.find(
          (flavor) => flavor.id === flavorId
        );

        if (!selectedFlavor) {
          return NextResponse.json(
            {
              error: "طعم انتخاب شده یافت نشد یا غیرفعال است",
            },
            {
              status: 404,
            }
          );
        }

        /*
         * تعداد فعلی همین طعم در سبد
         */
        let currentFlavorQuantity = 0;

        if (currentCart) {
          for (const item of currentCart.items) {
            for (const flavorItem of item.flavors) {
              if (flavorItem.flavorId === flavorId) {
                currentFlavorQuantity += flavorItem.quantity;
              }
            }
          }
        }

        const requestedFlavorQuantity =
          currentFlavorQuantity + quantity;

        if (requestedFlavorQuantity > selectedFlavor.stock) {
          return NextResponse.json(
            {
              error: `موجودی طعم ${selectedFlavor.name} کافی نیست`,
              flavor: selectedFlavor.name,
              availableStock: Math.max(
                selectedFlavor.stock - currentFlavorQuantity,
                0
              ),
            },
            {
              status: 400,
            }
          );
        }
      }

      // -------------------------------------------------------
      // Transaction
      // -------------------------------------------------------

      const result = await prisma.$transaction(async (tx) => {
        let cart = await tx.cart.findUnique({
          where: {
            userId,
          },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: {
              userId,
            },
          });
        }

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
            include: {
              flavors: true,
            },
          });
        }

        // -----------------------------------------------------
        // افزودن طعم
        // -----------------------------------------------------

        if (flavorId) {
          const existingFlavor =
            await tx.cartItemFlavor.findUnique({
              where: {
                cartItemId_flavorId: {
                  cartItemId: cartItem.id,
                  flavorId,
                },
              },
            });

          if (existingFlavor) {
            await tx.cartItemFlavor.update({
              where: {
                id: existingFlavor.id,
              },
              data: {
                quantity: {
                  increment: quantity,
                },
              },
            });
          } else {
  await tx.cartItemFlavor.create({
    data: {
      cartItemId: cartItem.id,
      flavorId,
      quantity,
      price: product.price,
    },
  });
}}

        // -----------------------------------------------------
        // افزایش تعداد محصول
        // -----------------------------------------------------

        const updatedCartItem =
          await tx.cartItem.update({
            where: {
              id: cartItem.id,
            },
            data: {
              quantity: {
                increment: quantity,
              },
            },
            include: {
              product: true,
              flavors: {
                include: {
                  flavor: true,
                },
              },
            },
          });

        return updatedCartItem;
      });

      return NextResponse.json({
        success: true,
        message: "محصول به سبد خرید اضافه شد",
        cartItem: result,
      });
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    if (action === "clear") {
      await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: {
            userId,
          },
        });

        if (!cart) {
          return;
        }

        /*
         * ابتدا ارتباط طعم‌ها حذف می‌شود.
         */
        await tx.cartItemFlavor.deleteMany({
          where: {
            cartItem: {
              cartId: cart.id,
            },
          },
        });

        /*
         * سپس آیتم‌های سبد حذف می‌شوند.
         */
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        /*
         * در نهایت خود سبد حذف می‌شود.
         */
        await tx.cart.delete({
          where: {
            id: cart.id,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "سبد خرید با موفقیت پاکسازی شد",
      });
    }

    // =========================================================
    // INVALID ACTION
    // =========================================================

    return NextResponse.json(
      {
        error: "اکشن نامعتبر. گزینه‌های مجاز: add, clear",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("Cart POST error:", error);

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