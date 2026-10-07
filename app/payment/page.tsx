import { Suspense } from "react";
import PaymentContent from "./PaymentContent";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">
              در حال اتصال به درگاه پرداخت...
            </p>
          </div>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}