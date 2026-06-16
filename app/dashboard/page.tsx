import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-7xl mx-auto p-10">
      <h1 className="text-4xl font-bold mb-10">داشبورد کاربر</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/orders"
          className="
            p-8
            rounded-3xl
            border border-white/10
            bg-white/[0.02]
            hover:border-violet-500
            transition-all
          "
        >
          <div className="text-3xl mb-4">📦</div>
          <h2 className="text-2xl font-bold">سفارشات من</h2>
          <p className="mt-3 text-zinc-500">مشاهده سفارشات و پیگیری وضعیت</p>
        </Link>

        <Link
          href="/dashboard/wishlist"
          className="
            p-8
            rounded-3xl
            border border-white/10
            bg-white/[0.02]
            hover:border-violet-500
            transition-all
          "
        >
          <div className="text-3xl mb-4">🤍</div>
          <h2 className="text-2xl font-bold">علاقه‌مندی‌ها</h2>
          <p className="mt-3 text-zinc-500">لیست کالاهای مورد علاقه شما</p>
        </Link>

        <Link
          href="/account"
          className="
            p-8
            rounded-3xl
            border border-white/10
            bg-white/[0.02]
            hover:border-violet-500
            transition-all
          "
        >
          <div className="text-3xl mb-4">👤</div>
          <h2 className="text-2xl font-bold">حساب کاربری</h2>
          <p className="mt-3 text-zinc-500">ویرایش پروفایل و آدرس‌های ذخیره شده</p>
        </Link>

        <Link
          href="/dashboard/notifications"
          className="
            p-8
            rounded-3xl
            border border-white/10
            bg-white/[0.02]
            hover:border-violet-500
            transition-all
          "
        >
          <div className="text-3xl mb-4">🔔</div>
          <h2 className="text-2xl font-bold">اعلان‌ها</h2>
          <p className="mt-3 text-zinc-500">اطلاع‌رسانی وضعیت سفارشات</p>
        </Link>
      </div>
    </div>
  );
}