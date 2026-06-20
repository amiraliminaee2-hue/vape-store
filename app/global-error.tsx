"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({
  reset,
}: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 px-4 py-16 dark:bg-red-950/20">
          <div className="mb-6 text-7xl">💥</div>
          <h1 className="mb-4 text-2xl font-bold text-red-700 dark:text-red-400">
            خطای غیرمنتظره
          </h1>
          <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
            مشکلی در برنامه رخ داده است. لطفاً صفحه را بازخوانی کنید.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}