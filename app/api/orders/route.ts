// app/api/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// =========================================================
// Types
// =========================================================

interface OrderFlavorInput {
  flavorId: number;
  quantity: number;
}

interface OrderItemInput {
  productId: number;
  quantity: number;

  /*
   * برای سازگاری با کدهای قبلی
   * هنوز flavorId را قبول می‌کنیم.
   */
  flavorId?: number | null;

  /*
   * حالت جدید:
   * چند طعم مختلف از یک محصول
   */
  flavors?: OrderFlavorInput[];
}

interface Product {
  id: number;
  title: string;
  stock: number;
  price: number;
  isActive: boolean;
}

interface Flavor {
  id: number;
  productId: number;
  name: string;
  stock: number;
  price: number | null;
  isActive: boolean;
}

// =========================================================
// POST - ایجاد سفارش
// =========================================================

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Orders API called");

    // =======================================================
    // دریافت Session
    // =======================================================

    const session = await getServerSession(authOptions);

    console.log("📋 Session:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "ابتدا وارد حساب کاربری شوید",
        },
        {
          status: 401,
        }
      );
    }

    const prisma = await getPrisma();

    const userId = session.user.id;

    // =======================================================
    // بررسی وجود واقعی User در دیتابیس
    // =======================================================

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    });

    if (!user) {
      console.error(
        "❌ Session user does not exist in database:",
        userId
      );

      return NextResponse.json(
        {
          error:
            "حساب کاربری شما معتبر نیست. لطفاً از حساب خارج شوید و دوباره وارد شوید.",
          code: "USER_NOT_FOUND",
        },
        {
          status: 401,
        }
      );
    }

    console.log("✅ User verified:", {
      id: user.id,
      phone: user.phone,
      name: user.name,
    });

    // =======================================================
    // دریافت Body
    // =======================================================

    const body = await request.json();

    console.log(
      "📦 Body received:",
      JSON.stringify(body, null, 2)
    );

    const {
      address,
      phone,
      items,
      customerNote,
      adminNote,
      couponCode,
      discountAmount,
      shippingMethodId,
      paymentMethodId,
      shippingPrice,
    } = body;

    // =======================================================
    // اعتبارسنجی اطلاعات پایه سفارش
    // =======================================================

    if (!address) {
      return NextResponse.json(
        {
          error: "آدرس الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "شماره تلفن الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "سبد خرید خالی است",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // اعتبارسنجی آیتم‌ها
    // =======================================================

    for (const item of items as OrderItemInput[]) {
      if (!item.productId) {
        return NextResponse.json(
          {
            error: "شناسه محصول نامعتبر است",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error: `تعداد محصول ${item.productId} نامعتبر است`,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // اعتبارسنجی flavors
      // -------------------------------------------------------

      if (item.flavors !== undefined) {
        if (!Array.isArray(item.flavors)) {
          return NextResponse.json(
            {
              error: `لیست طعم‌های محصول ${item.productId} نامعتبر است`,
            },
            {
              status: 400,
            }
          );
        }

        let flavorsQuantity = 0;

        for (const flavor of item.flavors) {
          if (
            !flavor ||
            !Number.isInteger(flavor.flavorId) ||
            flavor.flavorId <= 0
          ) {
            return NextResponse.json(
              {
                error: `شناسه طعم محصول ${item.productId} نامعتبر است`,
              },
              {
                status: 400,
              }
            );
          }

          if (
            !Number.isInteger(flavor.quantity) ||
            flavor.quantity <= 0
          ) {
            return NextResponse.json(
              {
                error: `تعداد طعم ${flavor.flavorId} نامعتبر است`,
              },
              {
                status: 400,
              }
            );
          }

          flavorsQuantity += flavor.quantity;
        }

        /*
         * مجموع تعداد طعم‌ها باید دقیقاً برابر
         * تعداد کلی OrderItem باشد.
         */
        if (
          item.flavors.length > 0 &&
          flavorsQuantity !== item.quantity
        ) {
          return NextResponse.json(
            {
              error:
                `تعداد طعم‌های محصول ${item.productId} ` +
                `با تعداد محصول برابر نیست`,
              details: {
                productQuantity: item.quantity,
                flavorsQuantity,
              },
            },
            {
              status: 400,
            }
          );
        }
      }

      // -------------------------------------------------------
      // سازگاری با flavorId قدیمی
      // -------------------------------------------------------

      if (
        item.flavorId !== undefined &&
        item.flavorId !== null &&
        (
          !Number.isInteger(item.flavorId) ||
          item.flavorId <= 0
        )
      ) {
        return NextResponse.json(
          {
            error: `شناسه طعم محصول ${item.productId} نامعتبر است`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // =======================================================
    // دریافت محصولات
    // =======================================================

    const orderItems = items as OrderItemInput[];

    const productIds = [
      ...new Set(
        orderItems.map(
          (item) => item.productId
        )
      ),
    ];

    const products = (await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })) as Product[];

    // =======================================================
    // بررسی وجود محصولات
    // =======================================================

    for (const item of orderItems) {
      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        return NextResponse.json(
          {
            error:
              `محصول با شناسه ${item.productId} یافت نشد`,
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
              `محصول ${product.title} در حال حاضر فعال نیست`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // =======================================================
    // دریافت طعم‌ها
    // =======================================================

    const requestedFlavorIds = [
      ...new Set(
        orderItems.flatMap((item) => {
          const ids: number[] = [];

          /*
           * حالت جدید
           */
          if (Array.isArray(item.flavors)) {
            for (const flavor of item.flavors) {
              ids.push(flavor.flavorId);
            }
          }

          /*
           * حالت قدیمی
           */
          if (
            item.flavorId !== undefined &&
            item.flavorId !== null
          ) {
            ids.push(item.flavorId);
          }

          return ids;
        })
      ),
    ];

    let flavors: Flavor[] = [];

    if (requestedFlavorIds.length > 0) {
      flavors = (await prisma.flavor.findMany({
        where: {
          id: {
            in: requestedFlavorIds,
          },
        },
      })) as Flavor[];
    }

    // =======================================================
    // تبدیل flavorId قدیمی به flavors جدید
    // =======================================================

    const normalizedItems: OrderItemInput[] =
      orderItems.map((item) => {
        /*
         * اگر flavors وجود دارد،
         * همان را استفاده می‌کنیم.
         */
        if (
          Array.isArray(item.flavors) &&
          item.flavors.length > 0
        ) {
          return {
            ...item,
            flavors: item.flavors.map(
              (flavor) => ({
                flavorId: Number(flavor.flavorId),
                quantity: Number(flavor.quantity),
              })
            ),
          };
        }

        /*
         * اگر فقط flavorId قدیمی ارسال شده،
         * آن را تبدیل به آرایه می‌کنیم.
         */
        if (
          item.flavorId !== undefined &&
          item.flavorId !== null
        ) {
          return {
            ...item,
            flavors: [
              {
                flavorId: Number(item.flavorId),
                quantity: item.quantity,
              },
            ],
          };
        }

        /*
         * محصول بدون طعم
         */
        return {
          ...item,
          flavors: [],
        };
      });

    // =======================================================
    // اعتبارسنجی طعم‌ها
    // =======================================================

    for (const item of normalizedItems) {
      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        continue;
      }

      const itemFlavors = item.flavors || [];

      /*
       * اگر محصول طعم دارد،
       * سفارش باید طعم داشته باشد.
       */
      const productFlavors = flavors.filter(
        (flavor) =>
          flavor.productId === product.id
      );

      if (
        productFlavors.length > 0 &&
        itemFlavors.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              `لطفاً طعم محصول ${product.title} را انتخاب کنید`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * اگر محصول طعم ندارد،
       * نباید طعم برای آن ارسال شود.
       */
      if (
        productFlavors.length === 0 &&
        itemFlavors.length > 0
      ) {
        return NextResponse.json(
          {
            error:
              `محصول ${product.title} دارای طعم نیست`,
          },
          {
            status: 400,
          }
        );
      }

      // -----------------------------------------------------
      // بررسی طعم‌های همین محصول
      // -----------------------------------------------------

      let flavorTotalQuantity = 0;

      for (const itemFlavor of itemFlavors) {
        const flavor = flavors.find(
          (f) =>
            f.id === itemFlavor.flavorId
        );

        if (!flavor) {
          return NextResponse.json(
            {
              error:
                `طعم با شناسه ${itemFlavor.flavorId} یافت نشد`,
            },
            {
              status: 404,
            }
          );
        }

        if (flavor.productId !== product.id) {
          return NextResponse.json(
            {
              error:
                `طعم ${flavor.name} متعلق به محصول ${product.title} نیست`,
            },
            {
              status: 400,
            }
          );
        }

        if (!flavor.isActive) {
          return NextResponse.json(
            {
              error:
                `طعم ${flavor.name} در حال حاضر فعال نیست`,
            },
            {
              status: 400,
            }
          );
        }

        flavorTotalQuantity +=
          itemFlavor.quantity;

        // ---------------------------------------------------
        // بررسی موجودی طعم
        // ---------------------------------------------------

        if (
          itemFlavor.quantity >
          flavor.stock
        ) {
          return NextResponse.json(
            {
              error:
                `موجودی طعم ${flavor.name} کافی نیست`,
              flavor: flavor.name,
              availableStock: flavor.stock,
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * مجموع طعم‌ها باید برابر quantity باشد.
       */
      if (
        itemFlavors.length > 0 &&
        flavorTotalQuantity !== item.quantity
      ) {
        return NextResponse.json(
          {
            error:
              `تعداد طعم‌های ${product.title} با تعداد سفارش برابر نیست`,
            details: {
              productQuantity: item.quantity,
              flavorQuantity: flavorTotalQuantity,
            },
          },
          {
            status: 400,
          }
        );
      }
    }

    // =======================================================
    // بررسی موجودی کلی محصولات
    // =======================================================

    /*
     * اگر یک محصول چند بار در items آمده باشد،
     * مجموع تعداد آن را محاسبه می‌کنیم.
     */

    const productQuantities =
      new Map<number, number>();

    for (const item of normalizedItems) {
      const current =
        productQuantities.get(
          item.productId
        ) || 0;

      productQuantities.set(
        item.productId,
        current + item.quantity
      );
    }

    for (const [
      productId,
      quantity,
    ] of productQuantities.entries()) {
      const product = products.find(
        (p) => p.id === productId
      );

      if (!product) {
        continue;
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error:
              `موجودی ${product.title} کافی نیست`,
            availableStock:
              product.stock,
          },
          {
            status: 400,
          }
        );
      }
    }

    // =======================================================
    // محاسبه قیمت
    // =======================================================

    let totalPrice = 0;

    for (const item of normalizedItems) {
      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        continue;
      }

      /*
       * قیمت پایه محصول
       */
      const productBasePrice =
        product.price;

      /*
       * قیمت طعم می‌تواند قیمت اضافه داشته باشد.
       */
      if (
        item.flavors &&
        item.flavors.length > 0
      ) {
        for (const itemFlavor of item.flavors) {
          const flavor = flavors.find(
            (f) =>
              f.id ===
              itemFlavor.flavorId
          );

          const flavorExtraPrice =
            flavor?.price || 0;

          const unitPrice =
            productBasePrice +
            flavorExtraPrice;

          totalPrice +=
            unitPrice *
            itemFlavor.quantity;
        }
      } else {
        totalPrice +=
          productBasePrice *
          item.quantity;
      }
    }

    // =======================================================
    // بررسی کوپن
    // =======================================================

    const finalDiscount =
      Math.max(
        Number(discountAmount) || 0,
        0
      );

    let appliedCouponId: number | null =
      null;

    let appliedCouponCode: string | null =
      null;

    if (couponCode) {
      const coupon =
        await prisma.coupon.findUnique({
          where: {
            code: String(
              couponCode
            ).toUpperCase(),
          },
        });

      if (
        coupon &&
        coupon.status === "ACTIVE"
      ) {
        const now = new Date();

        const isDateValid =
          (!coupon.startDate ||
            coupon.startDate <= now) &&
          (!coupon.endDate ||
            coupon.endDate >= now);

        const isUsageValid =
          !coupon.usageLimit ||
          coupon.usedCount <
            coupon.usageLimit;

        if (
          isDateValid &&
          isUsageValid
        ) {
          if (
            !coupon.minPurchase ||
            totalPrice >=
              coupon.minPurchase
          ) {
            appliedCouponId =
              coupon.id;

            appliedCouponCode =
              coupon.code;
          }
        }
      }
    }

    // =======================================================
    // محاسبه مبلغ نهایی
    // =======================================================

    const finalShippingPrice =
      Math.max(
        Number(shippingPrice) || 0,
        0
      );

    const finalTotal =
      totalPrice -
      finalDiscount +
      finalShippingPrice;

    if (finalTotal < 0) {
      return NextResponse.json(
        {
          error:
            "مبلغ نهایی سفارش نمی‌تواند منفی باشد",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // شماره پیگیری
    // =======================================================

    const trackingNumber =
      `VS-${Date.now()}`;

    // =======================================================
    // ایجاد سفارش
    // =======================================================

    const order =
      await prisma.$transaction(
        async (tx) => {
          // -------------------------------------------------
          // ایجاد Order
          // -------------------------------------------------

          const createdOrder =
            await tx.order.create({
              data: {
                userId,

                trackingNumber,

                userName:
                  user.phone ||
                  user.name ||
                  "کاربر",

                address,

                phone,

                customerNote:
                  customerNote || null,

                adminNote:
                  adminNote || null,

                totalPrice:
                  finalTotal,

                couponId:
                  appliedCouponId,

                couponCode:
                  appliedCouponCode,

                discountAmount:
                  finalDiscount,

                shippingMethodId:
                  shippingMethodId
                    ? Number(
                        shippingMethodId
                      )
                    : null,

                paymentMethodId:
                  paymentMethodId
                    ? Number(
                        paymentMethodId
                      )
                    : null,

                shippingPrice:
                  finalShippingPrice,

                status:
                  "REGISTERED",

                items: {
                  create:
                    normalizedItems.map(
                      (
                        item
                      ) => {
                        const product =
                          products.find(
                            (p) =>
                              p.id ===
                              item.productId
                          );

                        const itemFlavors =
                          item.flavors ||
                          [];

                        /*
                         * قیمت پایه OrderItem
                         */
                        const itemPrice =
                          product
                            ? product.price
                            : 0;

                        return {
                          productId:
                            item.productId,

                          quantity:
                            item.quantity,

                          price:
                            itemPrice,

                          /*
                           * ذخیره طعم‌های سفارش
                           */
                          flavors:
                            itemFlavors
                              .length >
                            0
                              ? {
                                  create:
                                    itemFlavors.map(
                                      (
                                        itemFlavor
                                      ) => {
                                        const flavor =
                                          flavors.find(
                                            (
                                              f
                                            ) =>
                                              f.id ===
                                              itemFlavor.flavorId
                                          );

                                        const flavorExtraPrice =
                                          flavor?.price ||
                                          0;

                                        return {
                                          flavorId:
                                            itemFlavor.flavorId,

                                          quantity:
                                            itemFlavor.quantity,

                                          price:
                                            itemPrice +
                                            flavorExtraPrice,
                                        };
                                      }
                                    ),
                                }
                              : undefined,
                        };
                      }
                    ),
                },
              },

              include: {
                items: {
                  include: {
                    product: true,

                    flavors: {
                      include: {
                        flavor: true,
                      },
                    },
                  },
                },
              },
            });

          console.log(
            "✅ Order created:",
            createdOrder.id
          );

          // -------------------------------------------------
          // کاهش موجودی محصولات
          // -------------------------------------------------

          for (const [
            productId,
            quantity,
          ] of productQuantities.entries()) {
            await tx.product.update({
              where: {
                id: productId,
              },

              data: {
                stock: {
                  decrement:
                    quantity,
                },
              },
            });
          }

          // -------------------------------------------------
          // کاهش موجودی طعم‌ها
          // -------------------------------------------------

          const flavorQuantities =
            new Map<
              number,
              number
            >();

          for (const item of normalizedItems) {
            for (const itemFlavor of
              item.flavors || []) {
              const current =
                flavorQuantities.get(
                  itemFlavor.flavorId
                ) || 0;

              flavorQuantities.set(
                itemFlavor.flavorId,
                current +
                  itemFlavor.quantity
              );
            }
          }

          for (const [
            flavorId,
            quantity,
          ] of flavorQuantities.entries()) {
            await tx.flavor.update({
              where: {
                id: flavorId,
              },

              data: {
                stock: {
                  decrement:
                    quantity,
                },
              },
            });
          }

          // -------------------------------------------------
          // حذف سبد خرید
          // -------------------------------------------------

          const cart =
            await tx.cart.findUnique({
              where: {
                userId,
              },
            });

          if (cart) {
            /*
             * به دلیل Cascade می‌توانیم
             * خود Cart را حذف کنیم و
             * CartItem و CartItemFlavor
             * نیز حذف می‌شوند.
             */
            await tx.cart.delete({
              where: {
                id: cart.id,
              },
            });
          }

          return createdOrder;
        }
      );

    // =======================================================
    // لاگ نهایی
    // =======================================================

    console.log(
      "✅ Order completed successfully:",
      {
        orderId: order.id,
        trackingNumber:
          order.trackingNumber,
        totalPrice:
          order.totalPrice,
        items:
          order.items.map(
            (item) => ({
              productId:
                item.productId,

              quantity:
                item.quantity,

              flavors:
                item.flavors.map(
                  (flavorItem) => ({
                    flavorId:
                      flavorItem.flavorId,

                    name:
                      flavorItem
                        .flavor
                        .name,

                    quantity:
                      flavorItem.quantity,

                    price:
                      flavorItem.price,
                  })
                ),
            })
          ),
      }
    );

    // =======================================================
    // پاسخ
    // =======================================================

    return NextResponse.json(
      order,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "❌ Create Order Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در ثبت سفارش",

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