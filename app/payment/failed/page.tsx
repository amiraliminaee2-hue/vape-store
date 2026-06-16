import Link from "next/link";

export default function FailedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-5xl font-bold text-red-400">
          پرداخت ناموفق
        </h1>

        <p className="mt-4 text-zinc-400">
          عملیات پرداخت لغو شد.
        </p>

        <Link
          href="/cart"
          className="
            inline-block
            mt-8
            px-6 py-3
            rounded-xl
            bg-violet-600
          "
        >
          بازگشت به سبد خرید
        </Link>

      </div>

    </main>
  );
}