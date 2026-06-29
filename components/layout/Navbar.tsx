"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${
            scrolled
              ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
              : "bg-transparent"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">

          {/* Logo - ریسپانسیو */}
          <Link
            href="/"
            onClick={closeMenu}
            className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent flex-shrink-0 whitespace-nowrap"
          >
            پاد بوشهر
          </Link>

          {/* Desktop Links - مخفی در موبایل و تبلت */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-zinc-300 text-base">
            <Link href="/" className="hover:text-white transition">
              خانه
            </Link>
            <Link href="/shop" className="hover:text-white transition">
              فروشگاه
            </Link>
            <Link href="/seller" className="hover:text-white transition">
              فروشنده شو
            </Link>
            {isSignedIn && (
              <Link href="/dashboard" className="hover:text-white transition">
                پنل کاربری
              </Link>
            )}
          </div>

          {/* Desktop Actions - مخفی در موبایل و تبلت */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            <Link
              href="/cart"
              className="px-4 xl:px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition text-sm xl:text-base"
            >
              سبد خرید
            </Link>

            {!isSignedIn ? (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 xl:px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition text-sm xl:text-base"
                >
                  ورود
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 xl:px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition text-sm xl:text-base"
                >
                  ثبت نام
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm xl:text-base text-zinc-400 max-w-[120px] xl:max-w-[140px] truncate">
                  {session?.user?.name || session?.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 xl:px-4 py-2 rounded-full border border-red-500/30 text-red-400 text-sm xl:text-base hover:bg-red-500/10 transition-colors"
                >
                  خروج
                </button>
              </div>
            )}
          </div>

          {/* Mobile + Tablet: Cart + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/cart"
              onClick={closeMenu}
              className="px-3 py-1.5 rounded-full border border-white/10 text-sm hover:bg-white/5 transition"
            >
              سبد خرید
            </Link>

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="باز کردن منو"
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 hover:border-white/30 transition-colors"
            >
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${
                  menuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                  menuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${
                  menuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile + Tablet Overlay */}
      <div
        onClick={closeMenu}
        className={`
          fixed inset-0 z-40 bg-black/70 backdrop-blur-sm
          lg:hidden
          transition-opacity duration-300
          ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Mobile + Tablet Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-50
          h-dvh max-h-dvh
          w-80 max-w-[85vw]
          bg-zinc-950/95 backdrop-blur-xl
          border-l border-white/10
          flex flex-col
          transition-transform duration-300 ease-out
          lg:hidden
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 flex-shrink-0">
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            پاد بوشهر
          </span>
          <button
            onClick={closeMenu}
            aria-label="بستن منو"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-base"
          >
            خانه
          </Link>
          <Link
            href="/shop"
            onClick={closeMenu}
            className="flex items-center px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-base"
          >
            فروشگاه
          </Link>
          <Link
            href="/seller"
            onClick={closeMenu}
            className="flex items-center px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-base"
          >
            فروشنده شو
          </Link>
          {isSignedIn && (
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="flex items-center px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-base"
            >
              پنل کاربری
            </Link>
          )}
        </div>

        {/* Drawer Footer / Auth */}
        <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-xl p-4 border-t border-white/10 flex flex-col gap-3">
          {!isSignedIn ? (
            <>
              <Link
                href="/auth/signin"
                onClick={closeMenu}
                className="w-full px-4 py-3 rounded-xl border border-white/10 text-base text-center hover:bg-white/5 transition-colors"
              >
                ورود
              </Link>
              <Link
                href="/auth/signup"
                onClick={closeMenu}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-base font-medium text-center transition"
              >
                ثبت نام
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400 px-1 truncate text-center">
                {session?.user?.name || session?.user?.email}
              </p>
              <button
                onClick={() => { handleSignOut(); closeMenu(); }}
                className="w-full px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-base hover:bg-red-500/10 transition-colors"
              >
                خروج
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}