"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [refId, setRefId] = useState<string | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error");
    const orderIdParam = searchParams.get("orderId");
    const messageParam = searchParams.get("message");
    const refIdParam = searchParams.get("refId");

    console.log("Payment result params:", { statusParam, errorParam, orderIdParam, messageParam, refIdParam });

    setOrderId(orderIdParam);
    setRefId(refIdParam);

    if (statusParam === "success") {
      setStatus("success");
      setMessage(messageParam || "پرداخت شما با موفقیت انجام شد");
    } else {
      setStatus("failed");
      setMessage(errorParam || "پرداخت انجام نشد");
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">در حال بررسی پرداخت...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0f] text-white py-20">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          {status === "success" ? (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">پرداخت موفق</h2>
              <p className="text-zinc-400 mb-2">{message}</p>
              {refId && (
                <p className="text-sm text-zinc-500 mb-4">شماره تراکنش: {refId}</p>
              )}
              <Link
                href={orderId ? `/account/orders/${orderId}` : "/account/orders"}
                className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                مشاهده سفارش
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">پرداخت ناموفق</h2>
              <p className="text-zinc-400 mb-6">{message}</p>
              <Link
                href="/cart"
                className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                بازگشت به سبد خرید
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}