import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session =
      await getServerSession(authOptions);

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

    const { id } = await params;

    const orderId =
      parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          error: "شناسه سفارش نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const prisma =
      await getPrisma();

    /*
     * -------------------------------------------------------
     * دریافت سفارش مشخص کاربر
     * -------------------------------------------------------
     *
     * سفارش فقط در صورتی برگردانده می‌شود که:
     *
     * 1. شناسه سفارش با id موجود در URL یکی باشد.
     * 2. سفارش متعلق به کاربر لاگین‌شده باشد.
     *
     * این شرط باعث می‌شود کاربر نتواند با تغییر
     * orderId به سفارش کاربر دیگری دسترسی پیدا کند.
     * -------------------------------------------------------
     */

    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },

        include: {
          items: {
            include: {
              product: true,

              /*
               * ------------------------------------------------
               * طعم‌های انتخاب شده سفارش
               * ------------------------------------------------
               *
               * OrderItem
               *   └── OrderItemFlavor
               *          └── Flavor
               *
               * اطلاعات کامل طعم شامل:
               *
               * - id
               * - flavorId
               * - quantity
               * - price
               * - flavor.name
               *
               * دریافت می‌شود تا در فاکتور نیز
               * قابل نمایش باشد.
               * ------------------------------------------------
               */

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

          shippingMethod: true,
          paymentMethod: true,
          coupon: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error: "سفارش یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * برگرداندن سفارش
     * -------------------------------------------------------
     *
     * در اینجا flavors نیز همراه هر OrderItem
     * به سمت صفحه سفارش کاربر ارسال می‌شود.
     * -------------------------------------------------------
     */

    return NextResponse.json(
      order
    );
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در دریافت سفارش",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
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

    const body =
      await request.json();

    const prisma =
      await getPrisma();

    const orderData: {
      address: string;
      phone: string;

      items: {
        productId: number;
        quantity: number;

        /*
         * طعم‌های انتخاب شده
         *
         * این قسمت اختیاری است تا
         * سفارش‌های بدون Flavor همچنان
         * بدون مشکل ایجاد شوند.
         */
        flavors?: {
          flavorId: number;
          quantity: number;
        }[];
      }[];

      customerNote?: string;
      adminNote?: string;
      shippingMethodId?: number;
      paymentMethodId?: number;
      shippingPrice?: number;
    } = body;

    /*
     * -------------------------------------------------------
     * ایجاد سفارش
     * -------------------------------------------------------
     *
     * توجه:
     * در این endpoint فعلاً price آیتم‌ها
     * همان منطق قبلی را حفظ می‌کند.
     *
     * مقدار price اولیه 0 است تا منطق
     * قیمت‌گذاری فعلی پروژه دست‌نخورده بماند.
     */

    const order =
      await prisma.order.create({
        data: {
          userId:
            session.user.id,

          address:
            orderData.address,

          phone:
            orderData.phone,

          customerNote:
            orderData.customerNote ??
            null,

          adminNote:
            orderData.adminNote ??
            null,

          shippingMethodId:
            orderData.shippingMethodId ??
            null,

          paymentMethodId:
            orderData.paymentMethodId ??
            null,

          shippingPrice:
            orderData.shippingPrice ||
            0,

          items: {
            create:
              orderData.items.map(
                (item) => ({
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  price: 0,

                  /*
                   * ------------------------------------------------
                   * طعم‌های سفارش
                   * ------------------------------------------------
                   *
                   * اگر Flavor ارسال شده باشد،
                   * OrderItemFlavor ساخته می‌شود.
                   *
                   * قیمت Flavor فعلاً از
                   * Product.price مستقل است و
                   * مقدار price آن در این مرحله
                   * صفر قرار می‌گیرد تا با منطق
                   * فعلی POST سازگار بماند.
                   *
                   * قیمت واقعی OrderItem باید در
                   * مرحله نهایی محاسبه سفارش تعیین شود.
                   */

                  flavors:
                    item.flavors &&
                    item.flavors.length > 0
                      ? {
                          create:
                            item.flavors.map(
                              (
                                flavor
                              ) => ({
                                flavorId:
                                  flavor.flavorId,

                                quantity:
                                  flavor.quantity,

                                price: 0,
                              })
                            ),
                        }
                      : undefined,
                })
              ),
          },

          userName:
            session.user.phone ||
            "کاربر",

          totalPrice: 0,

          trackingNumber:
            `ORD-${Date.now()}`,
        },
      });

    return NextResponse.json(
      order,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در ایجاد سفارش",
      },
      {
        status: 500,
      }
    );
  }
}