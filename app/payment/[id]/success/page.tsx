export const dynamic = "force-dynamic";

import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SuccessPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const prisma = await getPrisma();

  const order = await prisma.order.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!order) {
    redirect("/");
  }

  // فقط اگر سفارش هنوز REGISTERED باشد وضعیت را تغییر بده
  if (order.status === "REGISTERED") {
    await prisma.order.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "PAYED",
      },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div
        className="
          max-w-xl
          w-full
          text-center
          rounded-3xl
          border border-green-500/20
          p-10
        "
      >
        <h1 className="text-5xl font-bold text-green-400">
          پرداخت موفق
        </h1>
        <p className="mt-6 text-zinc-400">
          سفارش شما با موفقیت ثبت شد.
        </p>
        <p className="mt-2 text-zinc-500">
          شماره سفارش: {id}
        </p>
        <div className="mt-8">
          <a
            href={`/api/orders/${id}/invoice`}
            target="_blank"
            className="
              inline-flex
              px-6 py-3
              rounded-xl
              bg-violet-600
              hover:bg-violet-500
              transition-colors
            "
          >
            دانلود فاکتور PDF
          </a>
        </div>
        <Link
          href="/dashboard/orders"
          className="
            inline-block
            mt-4
            px-8 py-4
            rounded-xl
            bg-green-600
            hover:bg-green-500
            transition-colors
          "
        >
          مشاهده سفارشات
        </Link>
        <Link
          href="/"
          className="
            inline-block
            mt-4
            mr-4
            px-8 py-4
            rounded-xl
            border border-white/10
            hover:border-white/20
          "
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </main>
  );
}