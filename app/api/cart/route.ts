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
              orderBy: {
                flavor: {
                  name: "asc",
                },
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

      /*
       * -------------------------------------------------------
       * قیمت محصول
       * -------------------------------------------------------
       *
       * قیمت تمام Flavorها دقیقاً برابر قیمت محصول است.
       *
       * Flavor.price در محاسبات قیمت کاملاً نادیده گرفته
       * می‌شود.
       */

      const basePrice = product.price;
      const discountPercent = product.discountPercent || 0;

      const discountedProductPrice =
        discountPercent > 0
          ? Math.round(
              basePrice -
                (basePrice * discountPercent) / 100
            )
          : basePrice;

      /*
       * -------------------------------------------------------
       * اطلاعات طعم‌های انتخاب شده
       * -------------------------------------------------------
       *
       * هر Flavor همان قیمت نهایی Product را دارد.
       *
       * توجه:
       * flavorItem.price و flavorItem.flavor.price
       * عمداً استفاده نمی‌شوند.
       */

      const flavorDetails = item.flavors.map(
        (flavorItem) => {
          const flavorPrice = discountedProductPrice;

          return {
            id: flavorItem.id,
            flavorId: flavorItem.flavorId,
            name: flavorItem.flavor.name,
            quantity: flavorItem.quantity,

            /*
             * قیمت Flavor = قیمت Product بعد از تخفیف
             */
            price: flavorPrice,

            stock: flavorItem.flavor.stock,
            isActive: flavorItem.flavor.isActive,
          };
        }
      );

      /*
       * -------------------------------------------------------
       * تعداد واقعی محصول
       * -------------------------------------------------------
       *
       * برای محصول دارای طعم:
       *
       * quantity =
       * مجموع quantity تمام طعم‌ها
       *
       * مثال:
       *
       * توت فرنگی × 3
       * انبه × 2
       *
       * quantity = 5
       *
       * برای محصول بدون طعم:
       *
       * quantity = CartItem.quantity
       * -------------------------------------------------------
       */

      const flavorQuantity =
        item.flavors.reduce(
          (sum, flavorItem) =>
            sum + flavorItem.quantity,
          0
        );

      const hasFlavors =
        product.flavors.length > 0;

      const itemQuantity = hasFlavors
        ? flavorQuantity
        : item.quantity || 0;

      /*
       * -------------------------------------------------------
       * قیمت کل
       * -------------------------------------------------------
       */

      const totalPrice = hasFlavors
        ? flavorDetails.reduce(
            (sum, flavorItem) =>
              sum +
              flavorItem.price *
                flavorItem.quantity,
            0
          )
        : discountedProductPrice *
          itemQuantity;

      /*
       * -------------------------------------------------------
       * موجودی کلی محصول
       * -------------------------------------------------------
       */

      const selectedFlavorIds = new Set(
        item.flavors.map(
          (flavorItem) =>
            flavorItem.flavorId
        )
      );

      const currentQuantity = itemQuantity;

      const productAvailableStock =
        Math.max(
          product.stock -
            currentQuantity,
          0
        );

      /*
       * -------------------------------------------------------
       * موجودی طعم‌های انتخاب شده
       * -------------------------------------------------------
       */

      const selectedFlavorsStock =
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
            remainingStock:
              Math.max(
                flavorItem.flavor.stock -
                  flavorItem.quantity,
                0
              ),
          })
        );

      /*
       * -------------------------------------------------------
       * خروجی نهایی
       * -------------------------------------------------------
       */

      return {
        id: item.id,

        productId: product.id,

        title: product.title,

        /*
         * قیمت اصلی محصول
         */
        price: product.price,

        /*
         * قیمت نهایی محصول بعد از تخفیف
         */
        discountedPrice:
          discountedProductPrice,

        discountPercent,

        /*
         * تعداد کل محصول در سبد
         */
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
         * آیا حداقل یک طعم انتخاب شده؟
         */
        hasSelectedFlavors:
          item.flavors.length > 0,

        /*
         * تعداد طعم‌های مختلف انتخاب شده
         */
        selectedFlavorCount:
          item.flavors.length,

        /*
         * مجموع تعداد تمام طعم‌ها
         */
        totalFlavorQuantity:
          flavorQuantity,

        /*
         * طعم‌های انتخاب شده
         */
        flavors: flavorDetails,

        /*
         * موجودی طعم‌های انتخاب شده
         */
        selectedFlavorsStock,

        /*
         * طعم‌های فعال موجود برای انتخاب
         */
        availableFlavors:
          product.flavors.map(
            (flavor) => {
              const selectedFlavor =
                item.flavors.find(
                  (itemFlavor) =>
                    itemFlavor.flavorId ===
                    flavor.id
                );

              const selectedQuantity =
                selectedFlavor?.quantity ||
                0;

              return {
                id: flavor.id,
                name: flavor.name,
                stock: flavor.stock,
                isActive:
                  flavor.isActive,

                /*
                 * قیمت Flavor
                 *
                 * تمام Flavorها همان قیمت
                 * Product را دارند.
                 */
                price:
                  discountedProductPrice,

                /*
                 * تعداد این طعم که
                 * قبلاً در سبد است
                 */
                cartQuantity:
                  selectedQuantity,

                /*
                 * تعداد باقی‌مانده
                 */
                remainingStock:
                  Math.max(
                    flavor.stock -
                      selectedQuantity,
                    0
                  ),

                /*
                 * آیا قبلاً انتخاب شده؟
                 */
                isSelected:
                  selectedFlavorIds.has(
                    flavor.id
                  ),
              };
            }
          ),

        /*
         * موجودی قابل اضافه شدن
         */
        availableStock:
          productAvailableStock,

        /*
         * قیمت کل آیتم
         */
        totalPrice,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error(
      "Cart GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در دریافت سبد",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

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

    const prisma =
      await getPrisma();

    const userId =
      session.user.id;

    const body =
      await request.json();

    const {
      action,
      ...data
    } = body;

    // =========================================================
    // ADD TO CART
    // =========================================================

    if (action === "add") {
      const validationResult =
        cartItemSchema.safeParse(
          data
        );

      if (
        !validationResult.success
      ) {
        return NextResponse.json(
          {
            error:
              "ورودی نامعتبر",
            details:
              validationResult.error
                .issues,
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
      } =
        validationResult.data;

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "تعداد محصول باید بیشتر از صفر باشد",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // دریافت محصول و طعم‌های فعال
      // -------------------------------------------------------

      const product =
        await prisma.product.findUnique(
          {
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
          }
        );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "محصول یافت نشد",
          },
          {
            status: 404,
          }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          {
            error:
              "این محصول در حال حاضر فعال نیست",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // بررسی طعم
      // -------------------------------------------------------

      const hasFlavors =
        product.flavors.length > 0;

      if (
        hasFlavors &&
        !flavorId
      ) {
        return NextResponse.json(
          {
            error:
              "لطفاً طعم محصول را انتخاب کنید",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !hasFlavors &&
        flavorId
      ) {
        return NextResponse.json(
          {
            error:
              "این محصول دارای طعم نیست",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // بررسی موجودی محصول
      // -------------------------------------------------------

      if (
        product.stock <= 0
      ) {
        return NextResponse.json(
          {
            error:
              `محصول ${product.title} ناموجود است`,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // دریافت سبد فعلی
      // -------------------------------------------------------

      const currentCart =
        await prisma.cart.findUnique(
          {
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
          }
        );

      /*
       * -------------------------------------------------------
       * تعداد فعلی محصول
       * -------------------------------------------------------
       */

      let currentProductQuantity =
        0;

      if (currentCart) {
        for (
          const item
          of currentCart.items
        ) {
          const itemFlavorQuantity =
            item.flavors.reduce(
              (
                sum,
                flavorItem
              ) =>
                sum +
                flavorItem.quantity,
              0
            );

          currentProductQuantity +=
            item.flavors.length >
            0
              ? itemFlavorQuantity
              : item.quantity || 0;
        }
      }

      const requestedProductQuantity =
        currentProductQuantity +
        quantity;

      // -------------------------------------------------------
      // کنترل موجودی کلی محصول
      // -------------------------------------------------------

      if (
        requestedProductQuantity >
        product.stock
      ) {
        return NextResponse.json(
          {
            error:
              `موجودی محصول ${product.title} کافی نیست`,
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

      // -------------------------------------------------------
      // کنترل موجودی طعم
      // -------------------------------------------------------

      let selectedFlavor:
        | (typeof product.flavors[number])
        | null = null;

      if (flavorId) {
        selectedFlavor =
          product.flavors.find(
            (flavor) =>
              flavor.id ===
              flavorId
          ) || null;

        if (!selectedFlavor) {
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

        let currentFlavorQuantity =
          0;

        if (currentCart) {
          for (
            const item
            of currentCart.items
          ) {
            for (
              const flavorItem
              of item.flavors
            ) {
              if (
                flavorItem.flavorId ===
                flavorId
              ) {
                currentFlavorQuantity +=
                  flavorItem.quantity;
              }
            }
          }
        }

        const requestedFlavorQuantity =
          currentFlavorQuantity +
          quantity;

        if (
          requestedFlavorQuantity >
          selectedFlavor.stock
        ) {
          return NextResponse.json(
            {
              error:
                `موجودی طعم ${selectedFlavor.name} کافی نیست`,
              flavor:
                selectedFlavor.name,
              availableStock:
                Math.max(
                  selectedFlavor.stock -
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

      // -------------------------------------------------------
      // محاسبه قیمت نهایی محصول
      // -------------------------------------------------------
      //
      // قیمت فقط بر اساس Product محاسبه می‌شود.
      //
      // Flavor.price کاملاً نادیده گرفته می‌شود.
      //
      // CartItemFlavor.price فقط به عنوان snapshot
      // قیمت فعلی محصول ذخیره می‌شود.
      // -------------------------------------------------------

      const discountPercent =
        product.discountPercent ||
        0;

      const calculateFinalPrice =
        (
          basePrice: number
        ) => {
          if (
            discountPercent <= 0
          ) {
            return basePrice;
          }

          return Math.round(
            basePrice -
              (basePrice *
                discountPercent) /
                100
          );
        };

      const finalProductPrice =
        calculateFinalPrice(
          product.price
        );

      // -------------------------------------------------------
      // Transaction
      // -------------------------------------------------------

      const result =
        await prisma.$transaction(
          async (tx) => {
            let cart =
              await tx.cart.findUnique(
                {
                  where: {
                    userId,
                  },
                }
              );

            /*
             * اگر سبد وجود نداشت،
             * ایجاد می‌شود.
             */

            if (!cart) {
              cart =
                await tx.cart.create(
                  {
                    data: {
                      userId,
                    },
                  }
                );
            }

            /*
             * یک CartItem برای هر محصول
             */

            let cartItem =
              await tx.cartItem.findUnique(
                {
                  where: {
                    cartId_productId: {
                      cartId:
                        cart.id,
                      productId,
                    },
                  },
                  include: {
                    flavors: true,
                  },
                }
              );

            /*
             * اگر محصول قبلاً
             * در سبد نبود،
             * CartItem ایجاد می‌شود.
             */

            if (!cartItem) {
              cartItem =
                await tx.cartItem.create(
                  {
                    data: {
                      cartId:
                        cart.id,
                      productId,
                      quantity: 0,
                    },
                    include: {
                      flavors: true,
                    },
                  }
                );
            }

            // -------------------------------------------------
            // محصول دارای طعم
            // -------------------------------------------------

            if (flavorId) {
              const existingFlavor =
                await tx.cartItemFlavor.findUnique(
                  {
                    where: {
                      cartItemId_flavorId:
                        {
                          cartItemId:
                            cartItem.id,
                          flavorId,
                        },
                    },
                  }
                );

              /*
               * ------------------------------------------------
               * قیمت Flavor
               * ------------------------------------------------
               *
               * Flavor هیچ قیمت مستقلی ندارد.
               *
               * بنابراین قیمت آن همیشه برابر با
               * قیمت نهایی Product است.
               *
               * selectedFlavor.price عمداً استفاده نمی‌شود.
               */

              const finalFlavorPrice =
                finalProductPrice;

              /*
               * اگر طعم قبلاً
               * در سبد وجود دارد،
               * تعداد و قیمت به‌روزرسانی می‌شود.
               */

              if (
                existingFlavor
              ) {
                await tx.cartItemFlavor.update(
                  {
                    where: {
                      id:
                        existingFlavor.id,
                    },
                    data: {
                      quantity: {
                        increment:
                          quantity,
                      },

                      /*
                       * Snapshot قیمت فعلی محصول
                       *
                       * GET برای محاسبه قیمت از این
                       * مقدار استفاده نمی‌کند.
                       */
                      price:
                        finalFlavorPrice,
                    },
                  }
                );
              } else {
                /*
                 * طعم جدید
                 */

                await tx.cartItemFlavor.create(
                  {
                    data: {
                      cartItemId:
                        cartItem.id,
                      flavorId,
                      quantity,

                      /*
                       * قیمت Flavor همان
                       * قیمت نهایی Product است.
                       */
                      price:
                        finalFlavorPrice,
                    },
                  }
                );
              }
            }

            /*
             * -------------------------------------------------
             * بروزرسانی quantity اصلی CartItem
             * -------------------------------------------------
             *
             * برای محصول دارای طعم:
             *
             * quantity =
             * مجموع quantity طعم‌ها
             *
             * برای محصول بدون طعم:
             *
             * quantity افزایش پیدا می‌کند.
             */

            let newCartQuantity =
              cartItem.quantity;

            if (flavorId) {
              const flavorRows =
                await tx.cartItemFlavor.findMany(
                  {
                    where: {
                      cartItemId:
                        cartItem.id,
                    },
                  }
                );

              newCartQuantity =
                flavorRows.reduce(
                  (
                    sum,
                    flavorItem
                  ) =>
                    sum +
                    flavorItem.quantity,
                  0
                );
            } else {
              newCartQuantity +=
                quantity;
            }

            /*
             * بروزرسانی CartItem
             */

            const updatedCartItem =
              await tx.cartItem.update(
                {
                  where: {
                    id:
                      cartItem.id,
                  },
                  data: {
                    quantity:
                      newCartQuantity,
                  },
                  include: {
                    product: true,
                    flavors: {
                      include: {
                        flavor: true,
                      },
                    },
                  },
                }
              );

            return updatedCartItem;
          }
        );

      return NextResponse.json(
        {
          success: true,
          message:
            "محصول به سبد خرید اضافه شد",
          cartItem: result,
        }
      );
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    if (action === "clear") {
      await prisma.$transaction(
        async (tx) => {
          const cart =
            await tx.cart.findUnique(
              {
                where: {
                  userId,
                },
              }
            );

          if (!cart) {
            return;
          }

          /*
           * ابتدا ارتباط طعم‌ها حذف می‌شود.
           */

          await tx.cartItemFlavor.deleteMany(
            {
              where: {
                cartItem: {
                  cartId:
                    cart.id,
                },
              },
            }
          );

          /*
           * سپس آیتم‌های سبد
           * حذف می‌شوند.
           */

          await tx.cartItem.deleteMany(
            {
              where: {
                cartId:
                  cart.id,
              },
            }
          );

          /*
           * در نهایت خود سبد
           * حذف می‌شود.
           */

          await tx.cart.delete({
            where: {
              id: cart.id,
            },
          });
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "سبد خرید با موفقیت پاکسازی شد",
        }
      );
    }

    // =========================================================
    // INVALID ACTION
    // =========================================================

    return NextResponse.json(
      {
        error:
          "اکشن نامعتبر. گزینه‌های مجاز: add, clear",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Cart POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در عملیات سبد خرید",
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