"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const ALLOWED_PATHS_FOR_BANNED = [
  "/",
  "/shop",
  "/product",
  "/auth/signin",
  "/auth/phone-signin",
  "/banned",
  "/faq",
  "/contact",
  "/about",
];

function isAllowedPath(pathname: string) {
  return ALLOWED_PATHS_FOR_BANNED.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export default function BanCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // مهم: بررسی مسدود بودن نباید رندر اولیه کل سایت را متوقف کند.
    // خود APIها و صفحات حساس همچنان باید مجوز دسترسی را سمت سرور بررسی کنند.
    if (status !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;

    async function checkBanStatus() {
      try {
        const res = await fetch("/api/user/ban-status", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!res.ok || cancelled) return;

        const data = (await res.json()) as { isBanned?: boolean };

        if (data.isBanned && !isAllowedPath(pathname) && pathname !== "/banned") {
          router.replace("/banned");
        }
      } catch (error) {
        // خطای Ban Check نباید سایت را از دسترس خارج کند.
        console.error("Ban check error:", error);
      }
    }

    void checkBanStatus();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status, pathname, router]);

  // صفحه و محتوای اصلی فوراً رندر می‌شوند؛ BanCheck دیگر loading screen سراسری ندارد.
  return <>{children}</>;
}
