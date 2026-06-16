import Link from "next/link";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaymentPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div
        className="
          w-full
          max-w-xl
          rounded-3xl
          border border-white/10
          bg-white/[0.03]
          p-10
          text-center
        "
      >
        <h1 className="text-4xl font-bold">
          درگاه پرداخت آزمایشی
        </h1>

        <p className="mt-6 text-zinc-400">
          شماره سفارش:
          {" "}
          {id}
        </p>

        <p className="mt-3 text-zinc-500">
          این صفحه فعلاً شبیه‌سازی درگاه پرداخت است.
        </p>

        <div className="flex gap-4 mt-10 justify-center">
          <Link
            href={`/payment/${id}/success`}
            className="
              px-8 py-4
              rounded-xl
              bg-green-600
              hover:bg-green-500
            "
          >
            پرداخت موفق
          </Link>

          <Link
            href={`/payment/${id}/error`}
            className="
              px-8 py-4
              rounded-xl
              bg-red-600
              hover:bg-red-500
            "
          >
            پرداخت ناموفق
          </Link>
        </div>
      </div>
    </main>
  );
}