import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ErrorPage({
  params,
}: Props) {
  const { id } = await params;

  await prisma.order.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "ERROR",
    },
  });

  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div
        className="
          max-w-xl
          w-full
          text-center
          rounded-3xl
          border border-red-500/20
          p-10
        "
      >
        <h1 className="text-5xl font-bold text-red-400">
          پرداخت ناموفق
        </h1>

        <p className="mt-6 text-zinc-400">
          پرداخت انجام نشد.
        </p>

        <p className="mt-2 text-zinc-500">
          شماره سفارش: {id}
        </p>

        <Link
          href="/cart"
          className="
            inline-block
            mt-8
            px-8 py-4
            rounded-xl
            bg-red-600
          "
        >
          بازگشت به سبد خرید
        </Link>
      </div>
    </main>
  );
}