import Link from "next/link";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const adminAccess = await isAdmin(session.user.id);

  if (!adminAccess) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex">
        <aside
          className="
            w-64
            min-h-screen
            border-l border-white/10
            bg-black/40
            backdrop-blur-xl
            fixed
            right-0
            top-0
            flex
            flex-col
            z-50
          "
        >
          <div className="p-6 border-b border-white/10">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              پنل مدیریت
            </p>
            <h2 className="mt-1 text-xl font-bold">پاد بوشهر</h2>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link
              href="/admin"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>📊</span>
              داشبورد
            </Link>

            {/* بخش محصولات */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                محصولات
              </p>
            </div>

            <Link
              href="/admin/products"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>📋</span>
              لیست محصولات
            </Link>

            <Link
              href="/admin/products/import"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
                border border-emerald-500/20
                hover:border-emerald-500/40
              "
            >
              <span>📥</span>
              ورود دسته‌ای محصولات
            </Link>

            {/* بخش فروش */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                فروش
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>🛒</span>
              سفارشات
            </Link>

            <Link
              href="/admin/coupons"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>🎫</span>
              کدهای تخفیف
            </Link>

            {/* بخش مدیریت محتوا */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                مدیریت محتوا
              </p>
            </div>

            <Link
              href="/admin/categories"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>🏷️</span>
              دسته‌بندی‌ها
            </Link>

            <Link
              href="/admin/comments"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>💬</span>
              نظرات
            </Link>

            {/* بخش کاربران */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                کاربران
              </p>
            </div>

            <Link
              href="/admin/customers"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>👥</span>
              مشتریان
            </Link>

            <Link
              href="/admin/sellers"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>👤</span>
              فروشندگان
            </Link>

            {/* بخش گزارش‌گیری */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                گزارش‌گیری
              </p>
            </div>

            <Link
              href="/admin/reports"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
                border border-violet-500/20
                hover:border-violet-500/40
              "
            >
              <span>📉</span>
              گزارش حرفه‌ای
            </Link>

            {/* بخش تنظیمات */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs text-zinc-600 uppercase tracking-widest">
                تنظیمات
              </p>
            </div>

            <Link
              href="/admin/settings"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>⚙️</span>
              تنظیمات عمومی
            </Link>

            <Link
              href="/admin/shipping"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>🚚</span>
              روش‌های ارسال
            </Link>

            <Link
              href="/admin/payment"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-400
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
                font-medium
              "
            >
              <span>💳</span>
              روش‌های پرداخت
            </Link>
          </nav>

          <div className="p-4 border-t border-white/10">
            <Link
              href="/"
              className="
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                text-zinc-500
                hover:bg-white/5
                hover:text-white
                transition-all
                text-sm
              "
            >
              <span>←</span>
              بازگشت به سایت
            </Link>
          </div>
        </aside>

        <main className="flex-1 mr-64 p-8 min-h-screen">{children}</main>
      </div>
    </div>
  );
}