import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import Link from "next/link";

export default async function CouponReportsPage() {
  // دریافت همه کدهای تخفیف به همراه استفاده‌هاشون
  const coupons = await prisma.coupon.findMany({
    include: {
      usages: {
        include: {
          coupon: false,
        },
        orderBy: {
          usedAt: "desc",
        },
      },
      orders: {
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          id: true,
          trackingNumber: true,
          totalPrice: true,
          discountAmount: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // محاسبه آمار کلی
  const totalCoupons = coupons.length;
  const totalActiveCoupons = coupons.filter(c => c.status === "ACTIVE").length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => {
    const discountFromOrders = c.orders.reduce((orderSum, order) => orderSum + (order.discountAmount || 0), 0);
    return sum + discountFromOrders;
  }, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin/coupons" className="text-zinc-400 hover:text-white mb-2 inline-block">
              ← بازگشت به کدهای تخفیف
            </Link>
            <h1 className="text-3xl font-bold">گزارش کدهای تخفیف</h1>
            <p className="text-zinc-400 mt-1">آمار و عملکرد کدهای تخفیف</p>
          </div>
        </div>

        {/* کارت‌های آمار کلی */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-zinc-500 text-sm">مجموع کدها</p>
            <p className="text-3xl font-bold mt-2">{totalCoupons}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-zinc-500 text-sm">کدهای فعال</p>
            <p className="text-3xl font-bold mt-2 text-green-400">{totalActiveCoupons}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-zinc-500 text-sm">تعداد کل استفاده</p>
            <p className="text-3xl font-bold mt-2 text-blue-400">{totalUsedCount.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-zinc-500 text-sm">مجموع تخفیف داده شده</p>
            <p className="text-3xl font-bold mt-2 text-green-400">{totalDiscountGiven.toLocaleString("fa-IR")} تومان</p>
          </div>
        </div>

        {/* لیست کدها با آمار */}
        <div className="space-y-6">
          {coupons.map((coupon) => {
            const discountFromOrders = coupon.orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
            const isExpired = coupon.endDate && new Date(coupon.endDate) < new Date();
            const isActive = coupon.status === "ACTIVE" && !isExpired;
            
            return (
              <div
                key={coupon.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-mono font-bold">{coupon.code}</h2>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isActive 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-zinc-400">
                        نوع: {coupon.type === "FIXED" ? "مبلغ ثابت" : "درصدی"} - 
                        مقدار: {coupon.type === "FIXED" 
                          ? `${coupon.value.toLocaleString("fa-IR")} تومان`
                          : `${coupon.value}%`}
                      </p>
                      {coupon.minPurchase && (
                        <p className="text-zinc-500">حداقل خرید: {coupon.minPurchase.toLocaleString("fa-IR")} تومان</p>
                      )}
                      {coupon.endDate && (
                        <p className="text-zinc-500">
                          انقضا: {new Date(coupon.endDate).toLocaleDateString("fa-IR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-zinc-500">تعداد استفاده</p>
                    <p className="text-2xl font-bold">
                      {coupon.usedCount} / {coupon.usageLimit || "∞"}
                    </p>
                    <p className="text-sm text-green-400 mt-1">
                      تخفیف داده شده: {discountFromOrders.toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                </div>

                {/* لیست سفارش‌های استفاده شده */}
                {coupon.orders.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-zinc-500 mb-3">سفارش‌های استفاده کرده:</p>
                    <div className="space-y-2">
                      {coupon.orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                          <Link href={`/admin/orders/${order.id}`} className="text-violet-400 hover:text-violet-300">
                            #{order.id} - {order.trackingNumber}
                          </Link>
                          <div className="text-right">
                            <p className="text-green-400">-{order.discountAmount.toLocaleString("fa-IR")} تومان</p>
                            <p className="text-zinc-500 text-xs">
                              {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {coupon.orders.length > 10 && (
                        <p className="text-sm text-zinc-500 text-center pt-2">
                          و {coupon.orders.length - 10} سفارش دیگر...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {coupons.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              هیچ کد تخفیفی ثبت نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
}