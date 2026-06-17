import Link from "next/link";
import { getPrisma } from "@/lib/prisma";

interface Product {
  id: number;
  title: string;
  stock: number;
  price: number;
  isActive: boolean;
}

interface Order {
  id: number;
  totalPrice: number;
  discountAmount: number;
  couponCode: string | null;
  status: string;
  createdAt: Date;
  userName: string | null;
}

export default async function AdminDashboardPage() {
  const prisma = await getPrisma();
  
  const now = new Date();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(
    startOfWeek.getDate() -
      startOfWeek.getDay()
  );
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const [
    productsCount,
    categoriesCount,
    featuredCount,
    outOfStockCount,
    ordersCount,

    revenueResult,
    todayRevenue,
    weekRevenue,
    monthRevenue,

    latestProducts,
    latestOrders,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.category.count(),

    prisma.product.count({
      where: {
        isFeatured: true,
      },
    }),

    prisma.product.count({
      where: {
        stock: 0,
      },
    }),

    prisma.order.count(),

    prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },

      _sum: {
        totalPrice: true,
      },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },

      _sum: {
        totalPrice: true,
      },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },

      _sum: {
        totalPrice: true,
      },
    }),

    prisma.product.findMany({
      take: 5,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        title: true,
        stock: true,
        price: true,
        isActive: true,
      },
    }),

    prisma.order.findMany({
      take: 5,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        totalPrice: true,
        discountAmount: true,
        couponCode: true,
        status: true,
        createdAt: true,
        userName: true,
      },
    }),
  ]);

  const totalRevenue =
    revenueResult._sum.totalPrice ?? 0;

  const todayTotal =
    todayRevenue._sum.totalPrice ?? 0;

  const weekTotal =
    weekRevenue._sum.totalPrice ?? 0;

  const monthTotal =
    monthRevenue._sum.totalPrice ?? 0;

  // محاسبه مجموع تخفیف‌ها
  const totalDiscount = latestOrders.reduce((sum: number, order: Order) => sum + (order.discountAmount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            داشبورد مدیریت
          </h1>

          <p className="mt-2 text-zinc-500">
            نمای کلی فروشگاه
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="
              px-5 py-3
              rounded-2xl
              border border-white/10
              hover:border-white/20
              transition-all
            "
          >
            بازگشت به سایت
          </Link>

          <Link
            href="/admin/products"
            className="
              px-5 py-3
              rounded-2xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
            "
          >
            مدیریت محصولات
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-transparent p-6">
          <p className="text-zinc-400 text-sm">
            درآمد کل
          </p>

          <p className="mt-4 text-4xl font-bold">
            {totalRevenue.toLocaleString(
              "fa-IR"
            )}
          </p>

          <p className="mt-2 text-zinc-500 text-sm">
            تومان
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            فروش امروز
          </p>

          <p className="mt-4 text-4xl font-bold">
            {todayTotal.toLocaleString(
              "fa-IR"
            )}
          </p>

          <p className="mt-2 text-zinc-500 text-sm">
            تومان
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            فروش این هفته
          </p>

          <p className="mt-4 text-4xl font-bold">
            {weekTotal.toLocaleString(
              "fa-IR"
            )}
          </p>

          <p className="mt-2 text-zinc-500 text-sm">
            تومان
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            فروش این ماه
          </p>

          <p className="mt-4 text-4xl font-bold">
            {monthTotal.toLocaleString(
              "fa-IR"
            )}
          </p>

          <p className="mt-2 text-zinc-500 text-sm">
            تومان
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            تعداد سفارشات
          </p>

          <p className="mt-4 text-4xl font-bold">
            {ordersCount}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            تعداد محصولات
          </p>

          <p className="mt-4 text-4xl font-bold">
            {productsCount}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            دسته‌بندی‌ها
          </p>

          <p className="mt-4 text-4xl font-bold">
            {categoriesCount}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            محصولات ویژه
          </p>

          <p className="mt-4 text-4xl font-bold">
            {featuredCount}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-zinc-400 text-sm">
            محصولات ناموجود
          </p>

          <p className="mt-4 text-4xl font-bold text-red-400">
            {outOfStockCount}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-semibold">
            آخرین سفارشات
          </h2>
        </div>

        {latestOrders.length === 0 ? (
          <div className="p-8 text-zinc-500">
            هنوز سفارشی ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {latestOrders.map((order: Order) => {
              const hasDiscount = (order.discountAmount || 0) > 0;
              return (
                <div
                  key={order.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      سفارش #{order.id}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {order.userName ??
                        "کاربر"}
                    </p>

                    <p className="text-sm text-zinc-500">
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString(
                        "fa-IR"
                      )}
                    </p>
                    {order.couponCode && (
                      <p className="text-xs text-green-400 mt-1">
                        کد: {order.couponCode}
                      </p>
                    )}
                  </div>

                  <div className="text-left">
                    {hasDiscount && (
                      <p className="text-sm text-green-400">
                        -{(order.discountAmount || 0).toLocaleString("fa-IR")} تخفیف
                      </p>
                    )}
                    <p className="font-bold">
                      {order.totalPrice.toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </p>

                    <p className="text-sm text-zinc-400">
                      {order.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-semibold">
            آخرین محصولات
          </h2>

          <Link
            href="/admin/products"
            className="
              px-4 py-2
              rounded-full
              border border-white/10
              hover:border-violet-500/50
              transition-colors
            "
          >
            مشاهده همه
          </Link>
        </div>

        <div className="divide-y divide-white/5">
          {latestProducts.map(
            (product: Product) => (
              <div
                key={product.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">
                    {product.title}
                  </p>

                  <p className="text-sm text-zinc-500">
                    موجودی:
                    {" "}
                    {product.stock}
                  </p>
                </div>

                <div className="text-left">
                  <p>
                    {product.price.toLocaleString(
                      "fa-IR"
                    )}{" "}
                    تومان
                  </p>

                  <p
                    className={`text-sm ${
                      product.isActive
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {product.isActive
                      ? "فعال"
                      : "غیرفعال"}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}