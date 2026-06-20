import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

// تعریف interface برای OrderItem
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

// تعریف interface برای Order (بدون فیلدهای اضافی)
interface Order {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  address: string;
  phone: string;
  totalPrice: number;
  status: string;
  trackingNumber: string;
  couponCode: string | null;
  discountAmount: number;
  shippingMethodId: number | null;
  paymentMethodId: number | null;
  shippingPrice: number;
  customerNote: string | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

const statusLabels: Record<
  string,
  string
> = {
  REGISTERED: "ثبت شده",
  PAYED: "پرداخت شده",
  PROCESSING: "در حال پردازش",
  SHIPPING: "در مرحله ارسال",
  SHIPPED: "ارسال شده",
  CANCELLED: "لغو شده",
  ERROR: "خطا",
};

const statusColors: Record<
  string,
  string
> = {
  REGISTERED:
    "bg-yellow-500/20 text-yellow-300",
  PAYED:
    "bg-emerald-500/20 text-emerald-300",
  PROCESSING:
    "bg-blue-500/20 text-blue-300",
  SHIPPING:
    "bg-orange-500/20 text-orange-300",
  SHIPPED:
    "bg-violet-500/20 text-violet-300",
  CANCELLED:
    "bg-red-500/20 text-red-300",
  ERROR:
    "bg-red-500/20 text-red-300",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  const prisma = await getPrisma();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  }) as unknown as Order[];

  return (
    <div className="max-w-7xl mx-auto p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          سفارشات من
        </h1>

        <p className="mt-2 text-zinc-500">
          {orders.length} سفارش
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            p-10
            text-center
          "
        >
          <p className="text-zinc-500">
            هنوز سفارشی ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order: Order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="
                block
                rounded-3xl
                border border-white/10
                p-6
                hover:border-violet-500/50
                transition-all
              "
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">
                    سفارش #{order.id}
                  </h2>

                  <p className="mt-2 text-zinc-500">
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString(
                      "fa-IR"
                    )}
                  </p>

                  <p className="mt-2 text-zinc-400">
                    {order.items.length}
                    {" "}
                    محصول
                  </p>
                </div>

                <div className="text-left">
                  <div
                    className={`
                      inline-flex
                      px-3
                      py-1
                      rounded-full
                      text-sm
                      ${
                        statusColors[
                          order.status
                        ]
                      }
                    `}
                  >
                    {
                      statusLabels[
                        order.status
                      ]
                    }
                  </div>

                  <p className="mt-3 font-bold">
                    {order.totalPrice.toLocaleString(
                      "fa-IR"
                    )}
                    {" "}
                    تومان
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}