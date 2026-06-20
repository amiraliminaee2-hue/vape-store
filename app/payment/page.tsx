"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount") || "0";

  useEffect(() => {
    const initiatePayment = async () => {
      if (!orderId) {
        setError("شماره سفارش نامعتبر است");
        return;
      }

      try {
        const res = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: Number(orderId),
            amount: Number(amount),
          }),
        });

        const data = await res.json();

        if (res.ok && data.paymentUrl) {
          // هدایت به درگاه پرداخت واقعی
          window.location.href = data.paymentUrl;
        } else {
          setError(data.error || "خطا در اتصال به درگاه پرداخت");
        }
      } catch (error) {
        console.error("Payment initiation error:", error);
        setError("خطا در اتصال به درگاه پرداخت");
      }
    };

    initiatePayment();
  }, [orderId, amount]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400">خطا</h1>
          <p className="mt-4 text-zinc-400">{error}</p>
          <button
            onClick={() => router.push("/cart")}
            className="mt-6 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            بازگشت به سبد خرید
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">در حال اتصال به درگاه پرداخت...</p>
      </div>
    </main>
  );
}