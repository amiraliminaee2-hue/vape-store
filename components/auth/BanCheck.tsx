"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// صفحاتی که کاربر بن شده می‌تواند ببیند
const ALLOWED_PATHS_FOR_BANNED = [
  "/",
  "/shop",
  "/product",
  "/auth/signin",
  "/auth/signup",
  "/banned",
  "/faq",
  "/contact",
  "/about",
];

export default function BanCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    async function checkBanStatus() {
      if (status === "loading") return;

      if (!session?.user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch("/api/user/ban-status");
        if (res.ok) {
          const data = await res.json();
          setIsBanned(data.isBanned);

          const isAllowedPath = ALLOWED_PATHS_FOR_BANNED.some(path => 
            pathname === path || pathname.startsWith(path + "/")
          );

          // اگر بن هست و صفحه مجاز نیست، برو به صفحه بن
          if (data.isBanned && !isAllowedPath && pathname !== "/banned") {
            router.replace("/banned");
          }
        }
      } catch (error) {
        console.error("Ban check error:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkBanStatus();
  }, [session, status, pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // اگر بن هست و صفحه مجاز نیست (fallback)
  if (isBanned && !ALLOWED_PATHS_FOR_BANNED.some(path => pathname === path || pathname.startsWith(path + "/"))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="max-w-md w-full text-center bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
          <div className="text-6xl mb-6">⛔</div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">حساب کاربری شما مسدود شده است</h1>
          <p className="text-zinc-300 mb-6">
            شما دسترسی به این صفحه ندارید.
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}