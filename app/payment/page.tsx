"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const amount =
    searchParams.get("amount") || "0";

  const handleSuccess = async () => {
    router.push("/payment/success");
  };

  const handleFailed = () => {
    router.push("/payment/failed");
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div
        className="
          w-full
          max-w-lg
          rounded-3xl
          border border-white/10
          p-8
        "
      >
        <h1 className="text-3xl font-bold">
          درگاه پرداخت آزمایشی
        </h1>

        <p className="mt-4 text-zinc-400">
          مبلغ قابل پرداخت
        </p>

        <p className="text-4xl font-bold mt-3">
          {Number(amount).toLocaleString("fa-IR")}
          {" "}
          تومان
        </p>

        <div className="mt-10 space-y-3">
          <button
            onClick={handleSuccess}
            className="
              w-full
              py-4
              rounded-2xl
              bg-green-600
            "
          >
            پرداخت موفق
          </button>

          <button
            onClick={handleFailed}
            className="
              w-full
              py-4
              rounded-2xl
              bg-red-600
            "
          >
            پرداخت ناموفق
          </button>
        </div>
      </div>
    </main>
  );
}