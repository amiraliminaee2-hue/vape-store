import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const statusLabels: Record<string, string> = {
  REGISTERED: "سفارش شما ثبت شد",
  PAYED: "پرداخت سفارش تأیید شد",
  PROCESSING: "سفارش در حال پردازش است",
  SHIPPING: "سفارش در مرحله ارسال است",
  SHIPPED: "سفارش شما ارسال شد 🚚",
  CANCELLED: "سفارش لغو شد",
  ERROR: "خطا در پرداخت سفارش",
};

const statusIcons: Record<string, string> = {
  REGISTERED: "📋",
  PAYED: "✅",
  PROCESSING: "⚙️",
  SHIPPING: "📦",
  SHIPPED: "🚚",
  CANCELLED: "❌",
  ERROR: "⚠️",
};

const statusColors: Record<string, string> = {
  REGISTERED: "border-yellow-500/20 bg-yellow-500/5",
  PAYED: "border-emerald-500/20 bg-emerald-500/5",
  PROCESSING: "border-blue-500/20 bg-blue-500/5",
  SHIPPING: "border-orange-500/20 bg-orange-500/5",
  SHIPPED: "border-violet-500/20 bg-violet-500/5",
  CANCELLED: "border-red-500/20 bg-red-500/5",
  ERROR: "border-red-500/20 bg-red-500/5",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      totalPrice: true,
      createdAt: true,
    },
  });

  return (
    <main className="max-w-4xl mx-auto p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">اعلان‌ها</h1>
        <p className="mt-2 text-zinc-500">آخرین وضعیت سفارشات شما</p>
      </div>

      {orders.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            p-16
            text-center
          "
        >
          <p className="text-6xl mb-6">🔔</p>
          <p className="text-xl text-zinc-400">هیچ اعلانی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={
                "rounded-3xl border p-6 transition-all " +
                (statusColors[order.status] ?? "border-white/10 bg-white/[0.02]")
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">
                    {statusIcons[order.status] ?? "📋"}
                  </span>

                  <div>
                    <p className="font-semibold text-lg">
                      {statusLabels[order.status] ?? order.status}
                    </p>

                    <p className="mt-1 text-zinc-500 text-sm">
                      سفارش #{order.id} — کد پیگیری: {order.trackingNumber}
                    </p>

                    <p className="mt-1 text-zinc-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-left flex-shrink-0">
                  <p className="font-bold">
                    {order.totalPrice.toLocaleString("fa-IR")} تومان
                  </p>
                </div>
              </div>

              {order.status === "SHIPPED" && (
                <div
                  className="
                    mt-4
                    p-4
                    rounded-2xl
                    bg-violet-500/10
                    border border-violet-500/20
                  "
                >
                  <p className="text-violet-300 text-sm">
                    🎉 سفارش شما ارسال شده است. لطفاً منتظر تحویل باشید.
                  </p>
                </div>
              )}

              {order.status === "ERROR" && (
                <div
                  className="
                    mt-4
                    p-4
                    rounded-2xl
                    bg-red-500/10
                    border border-red-500/20
                  "
                >
                  <p className="text-red-300 text-sm">
                    پرداخت سفارش ناموفق بود. برای پیگیری با پشتیبانی تماس بگیرید.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}