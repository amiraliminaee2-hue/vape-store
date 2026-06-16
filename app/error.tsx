"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="mb-6 text-7xl">🔴</div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        خطایی رخ داده است
      </h1>
      <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
        متأسفانه در بارگذاری این صفحه مشکلی پیش آمده است.
        <br />
        لطفاً مجدداً تلاش کنید.
      </p>
      <Button
        onClick={reset}
        className="bg-red-600 hover:bg-red-700"
      >
        تلاش مجدد
      </Button>
    </div>
  );
}