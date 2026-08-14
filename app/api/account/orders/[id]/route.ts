import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type OrderStatus =
  | "REGISTERED"
  | "PAYED"
  | "ERROR"
  | "PROCESSING"
  | "SHIPPING"
  | "SHIPPED"
  | "CANCELLED";

interface OrderWhereInput {
  userId: string;
  status?: OrderStatus;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } =
      new URL(request.url);

    const page =
      parseInt(
        searchParams.get("page") || "1"
      );

    const limit =
      parseInt(
        searchParams.get("limit") || "10"
      );

    const statusParam =
      searchParams.get("status");

    const skip =
      (page - 1) * limit;

    const prisma =
      await getPrisma();

    const where: OrderWhereInput = {
      userId:
        session.user.id,
    };

    if (statusParam) {
      const validStatuses: OrderStatus[] = [
        "REGISTERED",
        "PAYED",
        "ERROR",
        "PROCESSING",
        "SHIPPING",
        "SHIPPED",
        "CANCELLED",
      ];

      if (
        validStatuses.includes(
          statusParam as OrderStatus
        )
      ) {
        where.status =
          statusParam as OrderStatus;
      }
    }

    const [orders, total] =
      await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
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
                 * قیمت Flavor عمداً برای محاسبه قیمت
                 * سفارش استفاده نمی‌شود.
                 *
                 * قیمت سفارش همان price ذخیره‌شده
                 * در OrderItem است.
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
        }),

        prisma.order.count({
          where,
        }),
      ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages:
        Math.ceil(
          total / limit
        ),
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "خطا در دریافت سفارشات",
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