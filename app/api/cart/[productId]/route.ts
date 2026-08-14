// app/api/cart/[productId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================
// Schema validation
// ============================================================

const bodySchema = z.object({
  action: z.enum([
    "increase",
    "decrease",
    "delete",
    "remove",
  ]),

  /*
   * برای محصولاتی که چند طعم دارند،
   * می‌توان مشخص کرد افزایش/کاهش مربوط به کدام طعم است.
   *
   * برای سازگاری با کد قبلی optional است.
   */
  flavorId: z.number().int().positive().nullable().optional(),
});

const paramsSchema = z.object({
  productId: z
    .string()
    .regex(/^\d+$/, "productId باید عدد باشد"),
});

// ============================================================
// POST
// ============================================================

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
    // ========================================================
    // Session
    // ========================================================

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

    // ========================================================
    // Params
    // ========================================================

    const { productId } = await params;

    const paramsValidationResult =
      paramsSchema.safeParse({
        productId,
      });

    if (!paramsValidationResult.success) {
      return NextResponse.json(
        {
          error: "پارامتر نامعتبر",
          details:
            paramsValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const numericProductId = Number(productId);

    // ========================================================
    // Body
    // ========================================================

    const body = await request.json();

    const bodyValidationResult =
      bodySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error:
            "ورودی نامعتبر. action باید increase، decrease، delete یا remove باشد",
          details:
            bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const {
      action,
      flavorId,
    } = bodyValidationResult.data;

    // ========================================================
    // پیدا کردن سبد خرید
    // ========================================================

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

    // ========================================================
    // پیدا کردن محصول
    // ========================================================

    const product =
      await prisma.product.findUnique({
        where: {
          id: numericProductId,
        },
        include: {
          flavors: {
            where: {
              isActive: true,
            },
            orderBy: {
              name: "asc",
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

    // ========================================================
    // پیدا کردن آیتم سبد
    // ========================================================

    const item =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: numericProductId,
          },
        },
        include: {
          flavors: {
            include: {
              flavor: true,
            },
          },
        },
      });

    // ========================================================
    // DELETE / REMOVE
    // ========================================================

    if (
      action === "delete" ||
      action === "remove"
    ) {
      if (!item) {
        return NextResponse.json({
          success: true,
          message:
            "آیتم قبلاً حذف شده است",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          /*
           * ابتدا ارتباط طعم‌ها حذف می‌شود.
           *
           * این کار باعث می‌شود حتی اگر Cascade
           * در Prisma schema فعال نباشد، حذف بدون
           * مشکل انجام شود.
           */
          await tx.cartItemFlavor.deleteMany({
            where: {
              cartItemId: item.id,
            },
          });

          await tx.cartItem.delete({
            where: {
              id: item.id,
            },
          });
        }
      );

      return NextResponse.json({
        success: true,
        message:
          "آیتم با موفقیت از سبد خرید حذف شد",
      });
    }

    // ========================================================
    // اگر آیتم وجود نداشته باشد
    // ========================================================

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

    // ========================================================
    // مشخص کردن طعم هدف
    // ========================================================

    let targetFlavorId:
      | number
      | null = null;

    /*
     * اگر flavorId مستقیماً ارسال شده باشد،
     * همان طعم هدف عملیات است.
     */
    if (flavorId) {
      targetFlavorId = flavorId;
    }

    /*
     * اگر flavorId ارسال نشده باشد:
     *
     * - اگر فقط یک طعم در آیتم باشد، همان طعم
     *   به صورت خودکار انتخاب می‌شود.
     *
     * - اگر چند طعم در آیتم باشد، نمی‌توانیم
     *   حدس بزنیم کاربر می‌خواهد کدام طعم را
     *   افزایش/کاهش دهد.
     */
    if (
      !targetFlavorId &&
      item.flavors.length === 1
    ) {
      targetFlavorId =
        item.flavors[0].flavorId;
    }

    // ========================================================
    // بررسی محصول دارای طعم
    // ========================================================

    const hasFlavors =
      product.flavors.length > 0;

    // ========================================================
    // INCREASE
    // ========================================================

    if (action === "increase") {
      // ------------------------------------------------------
      // بررسی موجودی کلی محصول
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // محصول دارای چند طعم
      // ------------------------------------------------------

      if (
        hasFlavors &&
        item.flavors.length > 1 &&
        !targetFlavorId
      ) {
        return NextResponse.json(
          {
            error:
              "این محصول چند طعم دارد. لطفاً طعم موردنظر را برای افزایش تعداد مشخص کنید.",
            code: "FLAVOR_REQUIRED",
            flavors:
              item.flavors.map(
                (flavorItem) => ({
                  flavorId:
                    flavorItem.flavorId,
                  name:
                    flavorItem.flavor.name,
                  quantity:
                    flavorItem.quantity,
                  stock:
                    flavorItem.flavor.stock,
                })
              ),
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // اگر طعم مشخص شده، پیدا کردن آن
      // ------------------------------------------------------

      let targetFlavor = null;
      let targetCartFlavor = null;

      if (targetFlavorId) {
        targetFlavor =
          product.flavors.find(
            (flavor) =>
              flavor.id === targetFlavorId
          );

        if (!targetFlavor) {
          return NextResponse.json(
            {
              error:
                "طعم انتخاب شده یافت نشد یا غیرفعال است",
            },
            {
              status: 404,
            }
          );
        }

        targetCartFlavor =
          item.flavors.find(
            (flavorItem) =>
              flavorItem.flavorId ===
              targetFlavorId
          );

        /*
         * اگر طعم در محصول فعال است ولی هنوز
         * در سبد وجود ندارد، برای افزایش باید
         * ارتباط آن ساخته شود.
         */
        if (!targetCartFlavor) {
          targetCartFlavor = null;
        }

        // ----------------------------------------------------
        // بررسی موجودی طعم
        // ----------------------------------------------------

        const currentFlavorQuantity =
          targetCartFlavor?.quantity || 0;

        if (
          currentFlavorQuantity + 1 >
          targetFlavor.stock
        ) {
          return NextResponse.json(
            {
              error: `موجودی طعم ${targetFlavor.name} کافی نیست`,
              flavor:
                targetFlavor.name,
              availableStock:
                Math.max(
                  targetFlavor.stock -
                    currentFlavorQuantity,
                  0
                ),
            },
            {
              status: 400,
            }
          );
        }
      }

      // ------------------------------------------------------
      // بررسی موجودی کلی محصول
      // ------------------------------------------------------

      const currentProductQuantity =
        item.quantity || 0;

      if (
        currentProductQuantity + 1 >
        product.stock
      ) {
        return NextResponse.json(
          {
            error: `موجودی محصول ${product.title} کافی نیست`,
            availableStock:
              Math.max(
                product.stock -
                  currentProductQuantity,
                0
              ),
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // Transaction
      // ------------------------------------------------------

      const updatedItem =
        await prisma.$transaction(
          async (tx) => {
            /*
             * افزایش تعداد کلی محصول
             */
            await tx.cartItem.update({
              where: {
                id: item.id,
              },
              data: {
                quantity: {
                  increment: 1,
                },
              },
            });

            /*
             * افزایش تعداد طعم
             */
            if (targetFlavorId) {
              const existingFlavor =
                await tx.cartItemFlavor.findUnique(
                  {
                    where: {
                      cartItemId_flavorId: {
                        cartItemId:
                          item.id,
                        flavorId:
                          targetFlavorId,
                      },
                    },
                  }
                );

              if (existingFlavor) {
                await tx.cartItemFlavor.update(
                  {
                    where: {
                      id: existingFlavor.id,
                    },
                    data: {
                      quantity: {
                        increment: 1,
                      },
                    },
                  }
                );
              } else {
                await tx.cartItemFlavor.create(
                  {
                    data: {
                      cartItemId:
                        item.id,
                      flavorId:
                        targetFlavorId,
                      quantity: 1,
                      price:
                        product.price,
                    },
                  }
                );
              }
            }

            return tx.cartItem.findUnique({
              where: {
                id: item.id,
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
          }
        );

      return NextResponse.json({
        success: true,
        message:
          "تعداد با موفقیت افزایش یافت",
        cartItem: updatedItem,
      });
    }

    // ========================================================
    // DECREASE
    // ========================================================

    if (action === "decrease") {
      // ------------------------------------------------------
      // اگر محصول چند طعم دارد و طعم مشخص نشده
      // ------------------------------------------------------

      if (
        hasFlavors &&
        item.flavors.length > 1 &&
        !targetFlavorId
      ) {
        return NextResponse.json(
          {
            error:
              "این محصول چند طعم دارد. لطفاً طعم موردنظر را برای کاهش تعداد مشخص کنید.",
            code: "FLAVOR_REQUIRED",
            flavors:
              item.flavors.map(
                (flavorItem) => ({
                  flavorId:
                    flavorItem.flavorId,
                  name:
                    flavorItem.flavor.name,
                  quantity:
                    flavorItem.quantity,
                  stock:
                    flavorItem.flavor.stock,
                })
              ),
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // اگر طعم مشخص شده
      // ------------------------------------------------------

      if (targetFlavorId) {
        const cartFlavor =
          item.flavors.find(
            (flavorItem) =>
              flavorItem.flavorId ===
              targetFlavorId
          );

        if (!cartFlavor) {
          return NextResponse.json(
            {
              error:
                "این طعم در سبد خرید وجود ندارد",
            },
            {
              status: 404,
            }
          );
        }

        // ----------------------------------------------------
        // اگر تعداد طعم فقط ۱ باشد
        // ----------------------------------------------------

        if (cartFlavor.quantity <= 1) {
          await prisma.$transaction(
            async (tx) => {
              await tx.cartItemFlavor.delete({
                where: {
                  id: cartFlavor.id,
                },
              });

              /*
               * تعداد کلی محصول هم باید یک واحد
               * کاهش پیدا کند.
               */
              if (item.quantity <= 1) {
                await tx.cartItem.delete({
                  where: {
                    id: item.id,
                  },
                });
              } else {
                await tx.cartItem.update({
                  where: {
                    id: item.id,
                  },
                  data: {
                    quantity: {
                      decrement: 1,
                    },
                  },
                });
              }
            }
          );

          return NextResponse.json({
            success: true,
            message:
              item.quantity <= 1
                ? "آیتم از سبد خرید حذف شد"
                : "تعداد طعم کاهش یافت",
            removed:
              item.quantity <= 1,
          });
        }

        // ----------------------------------------------------
        // کاهش تعداد طعم و محصول
        // ----------------------------------------------------

        const updatedItem =
          await prisma.$transaction(
            async (tx) => {
              await tx.cartItemFlavor.update({
                where: {
                  id: cartFlavor.id,
                },
                data: {
                  quantity: {
                    decrement: 1,
                  },
                },
              });

              return tx.cartItem.update({
                where: {
                  id: item.id,
                },
                data: {
                  quantity: {
                    decrement: 1,
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
            }
          );

        return NextResponse.json({
          success: true,
          message:
            "تعداد با موفقیت کاهش یافت",
          cartItem: updatedItem,
        });
      }

      // ======================================================
      // محصول بدون طعم
      // ======================================================

      if (item.quantity <= 1) {
        await prisma.$transaction(
          async (tx) => {
            await tx.cartItemFlavor.deleteMany({
              where: {
                cartItemId: item.id,
              },
            });

            await tx.cartItem.delete({
              where: {
                id: item.id,
              },
            });
          }
        );

        return NextResponse.json({
          success: true,
          message:
            "آیتم از سبد خرید حذف شد",
          removed: true,
        });
      }

      // ------------------------------------------------------
      // کاهش تعداد محصول بدون طعم
      // ------------------------------------------------------

      const updatedItem =
        await prisma.cartItem.update({
          where: {
            id: item.id,
          },
          data: {
            quantity: {
              decrement: 1,
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

      return NextResponse.json({
        success: true,
        message:
          "تعداد با موفقیت کاهش یافت",
        cartItem: updatedItem,
      });
    }

    // ========================================================
    // INVALID ACTION
    // ========================================================

    return NextResponse.json(
      {
        error:
          "اکشن نامعتبر. گزینه‌های مجاز: increase, decrease, delete, remove",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Cart operation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در بروزرسانی سبد خرید",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}